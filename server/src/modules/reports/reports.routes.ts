import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/monthly', ReportsController.getMonthlyReport);

export default router;
