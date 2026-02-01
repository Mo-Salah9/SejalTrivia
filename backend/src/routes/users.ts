import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  getUserInfo,
  getUserGameData,
  startGame,
  initializeUser,
} from '../controllers/userController';

const router = Router();

router.get('/:id', authenticateJWT, getUserInfo);
router.get('/:id/game-data', authenticateJWT, getUserGameData);
router.post('/:id/start-game', authenticateJWT, startGame);
router.post('/:id/initialize', authenticateJWT, initializeUser);

export default router;
