const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, updateStatus, remove, getAuditLog } = require('../controllers/deliveriesController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/audit-log', requireAdmin, getAuditLog);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/status', updateStatus);
router.delete('/:id', requireAdmin, remove);

module.exports = router;
