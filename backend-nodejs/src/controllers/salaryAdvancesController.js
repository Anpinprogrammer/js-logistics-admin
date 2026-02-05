const { pool } = require('../config/database');

// GET /api/salary-advances
const getAll = async (req, res) => {
  try {
    const { courier_id, week_start, week_end } = req.query;

    let query = `
      SELECT sa.*, p.full_name as courier_name
      FROM salary_advances sa
      LEFT JOIN profiles p ON sa.courier_id = p.user_id
      WHERE 1=1
    `;
    const params = [];
    let count = 0;

    if (courier_id) { count++; query += ` AND sa.courier_id = $${count}`; params.push(courier_id); }
    if (week_start) { count++; query += ` AND sa.week_start = $${count}`; params.push(week_start); }
    if (week_end) { count++; query += ` AND sa.week_end = $${count}`; params.push(week_end); }

    query += ' ORDER BY sa.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ data: result.rows, error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener anticipos' });
  }
};

// POST /api/salary-advances
const create = async (req, res) => {
  try {
    const { courier_id, amount, reason, week_start, week_end } = req.body;

    if (!courier_id || !amount || !reason || !week_start || !week_end) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO salary_advances (courier_id, created_by, amount, reason, week_start, week_end) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [courier_id, req.user.id, amount, reason, week_start, week_end]
    );

    res.status(201).json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear anticipo' });
  }
};

// DELETE /api/salary-advances/:id
const remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM salary_advances WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anticipo no encontrado' });
    }
    res.json({ data: { id: result.rows[0].id }, error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar anticipo' });
  }
};

module.exports = { getAll, create, remove };
