import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/signup', AuthController.signup);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
