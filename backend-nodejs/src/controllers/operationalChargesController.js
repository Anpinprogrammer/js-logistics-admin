const { pool } = require('../config/database');

// GET /api/operational-charges
const getAll = async (req, res) => {
  try {
    const { date } = req.query;

    let query = 'SELECT oc.*, p.full_name as created_by_name FROM operational_charges oc LEFT JOIN profiles p ON oc.created_by = p.user_id';
    const params = [];

    if (date) {
      query += ' WHERE oc.date = $1';
      params.push(date);
    }

    query += ' ORDER BY oc.date DESC, oc.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ data: result.rows, error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener gastos operacionales' });
  }
};

// POST /api/operational-charges
const create = async (req, res) => {
  try {
    const { description, amount, date } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'La descripción es requerida' });
    }

    const result = await pool.query(
      `INSERT INTO operational_charges (created_by, description, amount, date) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, description, amount || 0, date || new Date().toISOString().split('T')[0]]
    );

    res.status(201).json({ data: result.rows[0], error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear gasto operacional' });
  }
};

// DELETE /api/operational-charges/:id
const remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM operational_charges WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    res.json({ data: { id: result.rows[0].id }, error: null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
};

module.exports = { getAll, create, remove };
