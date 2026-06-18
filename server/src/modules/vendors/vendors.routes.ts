import { Router } from 'express';
import { VendorsController } from './vendors.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', VendorsController.list);
router.post('/', VendorsController.create);
router.patch('/:id', VendorsController.update);
router.delete('/:id', VendorsController.delete);

export default router;
