import { Router } from 'express';
import { CapitalController } from './capital.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Apply auth globally to all capital endpoints
router.use(authenticate);

router.get('/', CapitalController.list);
router.post('/', CapitalController.create);
router.patch('/:id', CapitalController.update);
router.delete('/:id', CapitalController.delete);

export default router;
