import { Router } from 'express';
import {
  signup,
  signin,
  googleSignin,
  appleSignin,
  resetPassword,
  verifyEmail,
  resendVerification,
  confirmResetPassword,
} from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', googleSignin);
router.post('/apple', appleSignin);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/reset-password', resetPassword);
router.post('/confirm-reset-password', confirmResetPassword);

export default router;
