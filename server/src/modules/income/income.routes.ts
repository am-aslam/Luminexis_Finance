import { Router } from 'express';
import { IncomeController } from './income.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Apply auth globally to all income endpoints
router.use(authenticate);

router.get('/', IncomeController.list);
router.post('/', IncomeController.create);
router.get('/:id', IncomeController.getById);
router.patch('/:id', IncomeController.update);
router.delete('/:id', IncomeController.delete);

export default router;
