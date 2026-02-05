const { pool } = require('../config/database');

// GET /api/weekly-settlements
const getAll = async (req, res) => {
  try {
    const { courier_id, week_start, week_end } = req.query;

    let query = `
      SELECT ws.*, p.full_name as courier_name
      FROM weekly_settlements ws
      LEFT JOIN profiles p ON ws.courier_id = p.user_id
      WHERE 1=1
    `;
    const params = [];
    let count = 0;

    if (courier_id) { count++; query += ` AND ws.courier_id = $${count}`; params.push(courier_id); }
    if (week_start) { count++; query += ` AND ws.week_start = $${count}`; params.push(week_start); }
    if (week_end) { count++; query += ` AND ws.week_end = $${count}`; params.push(week_end); }

    query += ' ORDER BY ws.week_start DESC';

    const result = await pool.query(query, params);
    res.json({ data: result.rows, error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener liquidaciones semanales' });
  }
};

// POST /api/weekly-settlements
const create = async (req, res) => {
  try {
    const {
      courier_id, week_start, week_end, total_deliveries,
      total_cash, total_transfers_courier, total_transfers_client,
      advances_deducted, final_balance
    } = req.body;

    const result = await pool.query(
      `INSERT INTO weekly_settlements 
        (courier_id, week_start, week_end, total_deliveries, total_cash, 
         total_transfers_courier, total_transfers_client, advances_deducted, final_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [courier_id, week_start, week_end, total_deliveries || 0, total_cash || 0,
       total_transfers_courier || 0, total_transfers_client || 0, advances_deducted || 0, final_balance || 0]
    );

    res.status(201).json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear liquidación semanal' });
  }
};

// PATCH /api/weekly-settlements/:id/settle
const settle = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE weekly_settlements 
       SET is_settled = true, settled_by = $1, settled_at = now()
       WHERE id = $2
       RETURNING *`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Liquidación no encontrada' });
    }

    res.json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al liquidar' });
  }
};

module.exports = { getAll, create, settle };
