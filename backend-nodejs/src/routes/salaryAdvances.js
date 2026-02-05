const express = require('express');
const router = express.Router();
const { getAll, create, remove } = require('../controllers/salaryAdvancesController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAll);
router.post('/', requireAdmin, create);
router.delete('/:id', requireAdmin, remove);

module.exports = router;
