import { Router } from 'express';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import {
  getCategories,
  saveCategories,
  subscribeToCategories,
} from '../controllers/categoryController';

const router = Router();

router.get('/', getCategories);
router.post('/', authenticateJWT, requireAdmin, saveCategories);
router.get('/subscribe', subscribeToCategories);

export default router;
