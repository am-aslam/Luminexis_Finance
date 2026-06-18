import { Router } from 'express';
import { LedgerController } from './ledger.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Apply auth globally to all ledger routes
router.use(authenticate);

router.get('/bank', LedgerController.getBankLedger);
router.get('/bank/balance', LedgerController.getBankBalance);
router.get('/me', LedgerController.getPersonalLedgerMe);
router.get('/:userId', LedgerController.getPersonalLedgerUser);

export default router;
