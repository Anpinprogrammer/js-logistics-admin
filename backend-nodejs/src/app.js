const express = require('express');
const corsMiddleware = require('./middleware/cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/couriers', require('./routes/couriers'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/daily-settlements', require('./routes/dailySettlements'));
app.use('/api/weekly-settlements', require('./routes/weeklySettlements'));
app.use('/api/operational-charges', require('./routes/operationalCharges'));
app.use('/api/salary-advances', require('./routes/salaryAdvances'));

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Cargo Guardian Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
