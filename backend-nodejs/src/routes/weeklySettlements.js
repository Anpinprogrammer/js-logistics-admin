const express = require('express');
const router = express.Router();
const { getAll, create, settle } = require('../controllers/weeklySettlementsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAll);
router.post('/', requireAdmin, create);
router.patch('/:id/settle', requireAdmin, settle);

module.exports = router;
