import { Router } from 'express';
import { CategoriesController } from './categories.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', CategoriesController.list);
router.post('/', CategoriesController.create);
router.patch('/:id', CategoriesController.update);
router.delete('/:id', CategoriesController.delete);

export default router;
