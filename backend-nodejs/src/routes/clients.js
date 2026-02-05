const express = require('express');
const router = express.Router();
const { getAll, getById, getWithDebt, create, update, remove, getStatement } = require('../controllers/clientsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/with-debt', requireAdmin, getWithDebt);
router.get('/:id/statement', getStatement);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', requireAdmin, remove);

module.exports = router;
