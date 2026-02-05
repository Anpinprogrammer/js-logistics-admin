const { pool } = require('../config/database');

// GET /api/couriers
const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.user_id, p.full_name, p.phone
       FROM profiles p
       INNER JOIN user_roles ur ON p.user_id = ur.user_id
       WHERE ur.role = 'courier'
       ORDER BY p.full_name`
    );

    res.json({ data: result.rows, error: null });
  } catch (error) {
    console.error('Error obteniendo mensajeros:', error);
    res.status(500).json({ error: 'Error al obtener mensajeros' });
  }
};

// GET /api/couriers/:id/stats
const getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { week_start, week_end } = req.query;

    if (!week_start || !week_end) {
      return res.status(400).json({ error: 'week_start y week_end son requeridos' });
    }

    const result = await pool.query(
      `SELECT * FROM deliveries 
       WHERE courier_id = $1 AND status = 'completed' 
       AND week_start >= $2 AND week_end <= $3`,
      [id, week_start, week_end]
    );

    const deliveries = result.rows;
    const stats = {
      totalDeliveries: deliveries.length,
      totalCash: 0,
      totalTransfersCourier: 0,
      totalTransfersClient: 0,
    };

    deliveries.forEach(d => {
      const amount = parseFloat(d.amount);
      switch (d.payment_method) {
        case 'cash':
          stats.totalCash += amount;
          break;
        case 'transfer_to_courier':
          stats.totalTransfersCourier += amount;
          break;
        case 'transfer_to_client':
          stats.totalTransfersClient += amount;
          break;
      }
    });

    res.json({ data: stats, error: null });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// GET /api/couriers/:id/summary
const getSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Entregas del día
    const deliveriesResult = await pool.query(
      `SELECT d.*, c.name as client_name
       FROM deliveries d
       LEFT JOIN clients c ON d.client_id = c.id
       WHERE d.courier_id = $1 AND d.delivery_date = $2
       ORDER BY d.created_at DESC`,
      [id, targetDate]
    );

    // Base del día
    const baseResult = await pool.query(
      'SELECT * FROM daily_base_money WHERE courier_id = $1 AND date = $2',
      [id, targetDate]
    );

    // Entregas parciales del día
    const partialsResult = await pool.query(
      'SELECT * FROM partial_deliveries WHERE courier_id = $1 AND date = $2',
      [id, targetDate]
    );

    const deliveries = deliveriesResult.rows;
    const baseMoney = baseResult.rows.length > 0 ? parseFloat(baseResult.rows[0].amount) : 0;
    const partialSum = partialsResult.rows.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Calcular totales
    let totalCash = 0;
    let totalTransfers = 0;
    let pendingCount = 0;
    let completedCount = 0;

    deliveries.forEach(d => {
      if (d.status === 'completed' || d.status === 'not_delivered_collected') {
        const received = parseFloat(d.received_amount) || 0;
        if (d.payment_method === 'cash') {
          totalCash += received;
        } else {
          totalTransfers += received;
        }
        completedCount++;
      } else if (d.status === 'pending') {
        pendingCount++;
      }
    });

    res.json({
      data: {
        date: targetDate,
        baseMoney,
        totalCash,
        totalTransfers,
        partialDeliveriesSum: partialSum,
        expectedBalance: baseMoney + totalCash - partialSum,
        pendingCount,
        completedCount,
        totalDeliveries: deliveries.length,
        deliveries,
      },
      error: null,
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen del mensajero' });
  }
};

module.exports = { getAll, getStats, getSummary };
