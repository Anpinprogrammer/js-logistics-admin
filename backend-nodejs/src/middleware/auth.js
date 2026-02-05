const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware para verificar JWT
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener usuario y rol
    const userResult = await pool.query(
      'SELECT u.id, u.email, u.full_name, ur.role FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar rol de admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// Middleware para verificar rol de courier
const requireCourier = (req, res, next) => {
  if (req.user.role !== 'courier' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireCourier };
