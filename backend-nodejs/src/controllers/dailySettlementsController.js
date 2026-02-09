const { pool } = require('../config/database');

// Helper: get current week dates (Saturday to Friday)
function getCurrentWeekDates(dateStr) {
  const date = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const dayOfWeek = date.getDay();
  const daysToLastSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - daysToLastSaturday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
  };
}

// GET /api/daily-settlements
const getAll = async (req, res) => {
  try {
    const { courier_id, date } = req.query;

    let query = `
      SELECT ds.*, p.full_name as courier_name
      FROM daily_settlements ds
      LEFT JOIN profiles p ON ds.courier_id = p.user_id
      WHERE 1=1
    `;
    const params = [];
    let count = 0;

    if (courier_id) {
      count++;
      query += ` AND ds.courier_id = $${count}`;
      params.push(courier_id);
    }
    if (date) {
      count++;
      query += ` AND ds.date = $${count}`;
      params.push(date);
    }

    query += ' ORDER BY ds.date DESC, ds.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ data: result.rows, error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener liquidaciones diarias' });
  }
};

// POST /api/daily-settlements
const create = async (req, res) => {
  try {
    const { courier_id, date, base_money, total_collected, partial_deliveries_sum, expected_balance, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO daily_settlements (courier_id, date, base_money, total_collected, partial_deliveries_sum, expected_balance, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [courier_id, date, base_money || 0, total_collected || 0, partial_deliveries_sum || 0, expected_balance || 0, notes || null]
    );

    res.status(201).json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear liquidación diaria' });
  }
};

// PATCH /api/daily-settlements/:id/settle
// Closes the daily settlement. If there's a shortfall, auto-creates a salary advance.
const settle = async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_balance, notes } = req.body;

    const existing = await pool.query('SELECT * FROM daily_settlements WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Liquidación no encontrada' });
    }

    const settlement = existing.rows[0];
    const actualVal = parseFloat(actual_balance) || 0;
    const expectedVal = parseFloat(settlement.expected_balance);
    const difference = actualVal - expectedVal;

    const result = await pool.query(
      `UPDATE daily_settlements 
       SET actual_balance = $1, difference = $2, is_settled = true, 
           settled_by = $3, settled_at = now(), notes = COALESCE($4, notes)
       WHERE id = $5
       RETURNING *`,
      [actualVal, difference, req.user.id, notes, id]
    );

    // If shortfall, auto-create salary advance
    if (difference < 0) {
      const { weekStart, weekEnd } = getCurrentWeekDates(settlement.date);
      await pool.query(
        `INSERT INTO salary_advances (courier_id, created_by, amount, reason, week_start, week_end)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          settlement.courier_id,
          req.user.id,
          Math.abs(difference),
          'Faltante cuadre diario',
          weekStart,
          weekEnd,
        ]
      );
    }

    res.json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al liquidar' });
  }
};

// PATCH /api/daily-settlements/reopen
// Reopens a settled daily settlement for a courier (e.g. when a new delivery is assigned after closing)
const reopen = async (req, res) => {
  try {
    const { courier_id, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const existing = await pool.query(
      'SELECT id FROM daily_settlements WHERE courier_id = $1 AND date = $2 AND is_settled = true',
      [courier_id, targetDate]
    );

    if (existing.rows.length === 0) {
      return res.json({ data: null, message: 'No hay cuadre cerrado para reabrir', error: null });
    }

    const result = await pool.query(
      `UPDATE daily_settlements 
       SET is_settled = false, settled_by = NULL, settled_at = NULL, actual_balance = NULL, difference = NULL
       WHERE id = $1
       RETURNING *`,
      [existing.rows[0].id]
    );

    res.json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al reabrir cuadre' });
  }
};

// POST /api/daily-settlements/base-money
const assignBaseMoney = async (req, res) => {
  try {
    const { courier_id, amount, date, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO daily_base_money (courier_id, assigned_by, amount, date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [courier_id, req.user.id, amount || 0, date || new Date().toISOString().split('T')[0], notes || null]
    );

    res.status(201).json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al asignar base' });
  }
};

// POST /api/daily-settlements/partial-delivery
const createPartialDelivery = async (req, res) => {
  try {
    const { courier_id, amount, date, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO partial_deliveries (courier_id, received_by, amount, date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [courier_id, req.user.id, amount, date || new Date().toISOString().split('T')[0], notes || null]
    );

    res.status(201).json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear entrega parcial' });
  }
};

module.exports = { getAll, create, settle, reopen, assignBaseMoney, createPartialDelivery };
