const express = require('express');
const router = express.Router();
const { getAll, getStats, getSummary } = require('../controllers/couriersController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAll);
router.get('/:id/stats', getStats);
router.get('/:id/summary', getSummary);

module.exports = router;
