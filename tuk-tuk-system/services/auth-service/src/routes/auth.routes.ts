import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AdminAuthController } from '../controllers/admin-auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authenticate';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  changePasswordSchema 
} from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();
const adminAuthController = new AdminAuthController();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/passwordless-login', authController.passwordlessLogin);
router.get('/challenge', authController.getChallenge);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

// Admin authentication routes
router.post('/admin/login', adminAuthController.adminLogin);
router.post('/admin/create', authenticate, adminAuthController.createAdmin);
router.get('/admin/list', authenticate, adminAuthController.listAdmins);

export default router;
