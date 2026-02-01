import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  createGameSession,
  getGameSession,
  updateGameSession,
} from '../controllers/gameSessionController';

const router = Router();

router.post('/', authenticateJWT, createGameSession);
router.get('/:id', authenticateJWT, getGameSession);
router.patch('/:id', authenticateJWT, updateGameSession);

export default router;
