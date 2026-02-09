const express = require('express');
const router = express.Router();
const { getAll, create, settle, reopen, assignBaseMoney, createPartialDelivery } = require('../controllers/dailySettlementsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAll);
router.post('/', requireAdmin, create);
router.patch('/:id/settle', requireAdmin, settle);
router.patch('/reopen', requireAdmin, reopen);
router.post('/base-money', requireAdmin, assignBaseMoney);
router.post('/partial-delivery', requireAdmin, createPartialDelivery);

module.exports = router;
