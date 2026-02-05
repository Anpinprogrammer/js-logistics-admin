const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/me', authenticate, me);

module.exports = router;
