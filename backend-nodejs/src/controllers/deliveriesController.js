const { pool } = require('../config/database');

// GET /api/deliveries
const getAll = async (req, res) => {
  try {
    const { client_id, courier_id, status, date, week_start, week_end, page = 1, limit = 10, search } = req.query;

    let query = `
      SELECT d.*, c.name as client_name, c.phone as client_phone, 
             c.company as client_company, c.identification_number as client_identification,
             p.full_name as courier_name
      FROM deliveries d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN profiles p ON d.courier_id = p.user_id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM deliveries d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN profiles p ON d.courier_id = p.user_id
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];
    let paramCount = 0;

    // For non-admin couriers, restrict to own deliveries
    if (req.user.role === 'courier') {
      paramCount++;
      const condition = ` AND d.courier_id = $${paramCount}`;
      query += condition;
      countQuery += condition;
      params.push(req.user.id);
      countParams.push(req.user.id);
    }

    if (client_id) {
      paramCount++;
      const condition = ` AND d.client_id = $${paramCount}`;
      query += condition;
      countQuery += condition;
      params.push(client_id);
      countParams.push(client_id);
    }
    if (courier_id && req.user.role === 'admin') {
      paramCount++;
      const condition = ` AND d.courier_id = $${paramCount}`;
      query += condition;
      countQuery += condition;
      params.push(courier_id);
      countParams.push(courier_id);
    }
    if (status) {
      paramCount++;
      const condition = ` AND d.status = $${paramCount}`;
      query += condition;
      countQuery += condition;
      params.push(status);
      countParams.push(status);
    }
    if (date) {
      paramCount++;
      const condition = ` AND d.delivery_date = $${paramCount}`;
      query += condition;
      countQuery += condition;
      params.push(date);
      countParams.push(date);
    }
    if (week_start) {
      paramCount++;
      const condition = ` AND d.week_start >= $${paramCount}`;
      query += condition;
      countQuery += condition;
      params.push(week_start);
      countParams.push(week_start);
    }
    if (week_end) {
      paramCount++;
      const condition = ` AND d.week_end <= $${paramCount}`;
      query += condition;
      countQuery += condition;
      params.push(week_end);
      countParams.push(week_end);
    }
    if (search) {
      paramCount++;
      const condition = ` AND (c.name ILIKE $${paramCount} OR p.full_name ILIKE $${paramCount} OR d.id::text ILIKE $${paramCount} OR d.recipient_name ILIKE $${paramCount} OR d.notes ILIKE $${paramCount})`;
      query += condition;
      countQuery += condition;
      const searchParam = `%${search}%`;
      params.push(searchParam);
      countParams.push(searchParam);
    }

    query += ' ORDER BY d.created_at DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limitNum);
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    // Map results to include nested client/courier objects (matching frontend structure)
    const deliveries = result.rows.map(row => ({
      ...row,
      client: {
        id: row.client_id,
        name: row.client_name,
        phone: row.client_phone,
        company: row.client_company,
        identification_number: row.client_identification,
      },
      courier: {
        full_name: row.courier_name || 'Sin nombre',
      },
    }));

    res.json({
      data: deliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error('Error obteniendo entregas:', error);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
};

// GET /api/deliveries/:id
const getById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, c.name as client_name, c.phone as client_phone,
              c.company as client_company, c.identification_number as client_identification,
              p.full_name as courier_name
       FROM deliveries d
       LEFT JOIN clients c ON d.client_id = c.id
       LEFT JOIN profiles p ON d.courier_id = p.user_id
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }

    const row = result.rows[0];
    const delivery = {
      ...row,
      client: {
        id: row.client_id,
        name: row.client_name,
        phone: row.client_phone,
        company: row.client_company,
        identification_number: row.client_identification,
      },
      courier: {
        full_name: row.courier_name || 'Sin nombre',
      },
    };

    res.json({ data: delivery, error: null });
  } catch (error) {
    console.error('Error obteniendo entrega:', error);
    res.status(500).json({ error: 'Error al obtener entrega' });
  }
};

// POST /api/deliveries
const create = async (req, res) => {
  try {
    const {
      client_id, courier_id, amount, service_value, total_to_collect,
      payment_method, recipient_name, notes, week_start, week_end,
      delivery_date, received_amount, receipt_photo_url
    } = req.body;

    if (!client_id || !courier_id || amount === undefined || !payment_method || !week_start || !week_end) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO deliveries 
        (client_id, courier_id, created_by, amount, service_value, total_to_collect, 
         payment_method, recipient_name, notes, week_start, week_end, delivery_date,
         received_amount, receipt_photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        client_id, courier_id, req.user.id, amount,
        service_value || 0, total_to_collect || 0,
        payment_method, recipient_name || null, notes || null,
        week_start, week_end, delivery_date || new Date().toISOString().split('T')[0],
        received_amount || null, receipt_photo_url || null
      ]
    );

    // Log de auditoría
    await pool.query(
      `INSERT INTO delivery_audit_log (delivery_id, action, changed_by, new_values)
       VALUES ($1, 'created', $2, $3)`,
      [result.rows[0].id, req.user.id, JSON.stringify(result.rows[0])]
    );

    res.status(201).json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error creando entrega:', error);
    res.status(500).json({ error: 'Error al crear entrega' });
  }
};

// PUT /api/deliveries/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener valores anteriores
    const oldResult = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }
    const oldValues = oldResult.rows[0];

    const {
      client_id, courier_id, amount, service_value, total_to_collect,
      payment_method, recipient_name, notes, status, received_amount,
      receipt_photo_url, reason
    } = req.body;

    const result = await pool.query(
      `UPDATE deliveries SET
        client_id = COALESCE($1, client_id),
        courier_id = COALESCE($2, courier_id),
        amount = COALESCE($3, amount),
        service_value = COALESCE($4, service_value),
        total_to_collect = COALESCE($5, total_to_collect),
        payment_method = COALESCE($6, payment_method),
        recipient_name = $7,
        notes = $8,
        status = COALESCE($9, status),
        received_amount = $10,
        receipt_photo_url = $11,
        updated_at = now()
       WHERE id = $12
       RETURNING *`,
      [
        client_id, courier_id, amount, service_value, total_to_collect,
        payment_method, recipient_name, notes, status, received_amount,
        receipt_photo_url, id
      ]
    );

    // Log de auditoría
    await pool.query(
      `INSERT INTO delivery_audit_log (delivery_id, action, changed_by, old_values, new_values, reason)
       VALUES ($1, 'updated', $2, $3, $4, $5)`,
      [id, req.user.id, JSON.stringify(oldValues), JSON.stringify(result.rows[0]), reason || null]
    );

    res.json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error actualizando entrega:', error);
    res.status(500).json({ error: 'Error al actualizar entrega' });
  }
};

// PATCH /api/deliveries/:id/status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, received_amount, receipt_photo_url, reason } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'El estado es requerido' });
    }

    const oldResult = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }

    const updateFields = ['status = $1', 'updated_at = now()'];
    const params = [status];
    let paramCount = 1;

    if (received_amount !== undefined) {
      paramCount++;
      updateFields.push(`received_amount = $${paramCount}`);
      params.push(received_amount);
    }
    if (receipt_photo_url !== undefined) {
      paramCount++;
      updateFields.push(`receipt_photo_url = $${paramCount}`);
      params.push(receipt_photo_url);
    }

    paramCount++;
    params.push(id);

    const result = await pool.query(
      `UPDATE deliveries SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    // Log de auditoría
    await pool.query(
      `INSERT INTO delivery_audit_log (delivery_id, action, changed_by, old_values, new_values, reason)
       VALUES ($1, 'status_changed', $2, $3, $4, $5)`,
      [id, req.user.id, JSON.stringify(oldResult.rows[0]), JSON.stringify(result.rows[0]), reason || null]
    );

    res.json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// DELETE /api/deliveries/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const oldResult = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }

    await pool.query(
      `INSERT INTO delivery_audit_log (delivery_id, action, changed_by, old_values, reason)
       VALUES ($1, 'deleted', $2, $3, $4)`,
      [id, req.user.id, JSON.stringify(oldResult.rows[0]), reason || null]
    );

    await pool.query('DELETE FROM deliveries WHERE id = $1', [id]);

    res.json({ data: { id }, error: null });
  } catch (error) {
    console.error('Error eliminando entrega:', error);
    res.status(500).json({ error: 'Error al eliminar entrega' });
  }
};

// GET /api/deliveries/audit-log
const getAuditLog = async (req, res) => {
  try {
    const { delivery_id, limit = 50 } = req.query;

    let query = `
      SELECT dal.*, p.full_name as changed_by_name
      FROM delivery_audit_log dal
      LEFT JOIN profiles p ON dal.changed_by = p.user_id
    `;
    const params = [];

    if (delivery_id) {
      query += ' WHERE dal.delivery_id = $1';
      params.push(delivery_id);
    }

    query += ` ORDER BY dal.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json({ data: result.rows, error: null });
  } catch (error) {
    console.error('Error obteniendo log de auditoría:', error);
    res.status(500).json({ error: 'Error al obtener log de auditoría' });
  }
};

module.exports = { getAll, getById, create, update, updateStatus, remove, getAuditLog };
