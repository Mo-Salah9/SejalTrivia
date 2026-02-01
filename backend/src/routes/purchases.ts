import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  verifyPurchase,
  processPurchase,
  getUserPurchases,
} from '../controllers/purchaseController';

const router = Router();

router.post('/verify', authenticateJWT, verifyPurchase);
router.post('/process', authenticateJWT, processPurchase);
router.get('/:userId', authenticateJWT, getUserPurchases);

export default router;
