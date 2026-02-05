const { pool } = require('../config/database');

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
const settle = async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_balance, notes } = req.body;

    const existing = await pool.query('SELECT * FROM daily_settlements WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Liquidación no encontrada' });
    }

    const settlement = existing.rows[0];
    const difference = (actual_balance || 0) - parseFloat(settlement.expected_balance);

    const result = await pool.query(
      `UPDATE daily_settlements 
       SET actual_balance = $1, difference = $2, is_settled = true, 
           settled_by = $3, settled_at = now(), notes = COALESCE($4, notes)
       WHERE id = $5
       RETURNING *`,
      [actual_balance, difference, req.user.id, notes, id]
    );

    res.json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al liquidar' });
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

module.exports = { getAll, create, settle, assignBaseMoney, createPartialDelivery };
