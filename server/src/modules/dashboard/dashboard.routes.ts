import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Apply auth globally to all dashboard routes
router.use(authenticate);

router.get('/summary', DashboardController.getSummary);

export default router;
