import { Router } from 'express';
import { ExpensesController } from './expenses.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Apply authentication middleware globally to all expenses routes
router.use(authenticate);

router.get('/', ExpensesController.list);
router.get('/export', ExpensesController.exportExcel);
router.post('/', ExpensesController.create);
router.get('/:id', ExpensesController.getById);
router.patch('/:id', ExpensesController.update);
router.delete('/:id', ExpensesController.delete);

export default router;
