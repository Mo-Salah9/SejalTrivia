import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  createCheckoutSession,
  handleWebhook,
  verifySession,
} from '../controllers/lemonSqueezyController';

const router = Router();

// Create Stripe Checkout session (requires auth)
router.post('/create-checkout-session', authenticateJWT, createCheckoutSession);

// Stripe webhook (NO auth — Stripe sends this directly, verified via signature)
// Note: raw body parsing is handled in index.ts before json parsing
router.post('/webhook', handleWebhook);

// Verify session after redirect (requires auth)
router.post('/verify-session', authenticateJWT, verifySession);

export default router;
