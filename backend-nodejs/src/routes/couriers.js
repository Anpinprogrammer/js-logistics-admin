const express = require('express');
const router = express.Router();
const { getAll, create, update, remove, getStats, getSummary } = require('../controllers/couriersController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAll);
router.post('/', requireAdmin, create);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);
router.get('/:id/stats', getStats);
router.get('/:id/summary', getSummary);

module.exports = router;
