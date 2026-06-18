import { Router } from 'express';
import { InvitationsController } from './invitations.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Public endpoint to verify invitation token details
router.get('/token/:token', InvitationsController.getDetailsByToken);

// Authenticated endpoints for managing invitations
router.use(authenticate);
router.get('/', InvitationsController.list);
router.post('/', InvitationsController.create);
router.delete('/:id', InvitationsController.delete);

export default router;
