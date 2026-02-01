import { Response } from 'express';
import GameSession from '../models/GameSession';
import { AuthRequest } from '../middleware/auth';

export const createGameSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId, ...gameState } = req.body;
    const userId = req.user?.uid || 'anonymous';

    const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session = await GameSession.create({
      sessionId: id,
      userId,
      players: gameState.players || [],
      currentTurn: gameState.currentTurn || 0,
      categories: gameState.categories || [],
      activeQuestion: gameState.activeQuestion || null,
      language: gameState.language || 'ar',
      status: 'active',
    });

    res.status(201).json({ sessionId: session.sessionId });
  } catch (error: any) {
    console.error('Create game session error:', error);
    res.status(500).json({ error: 'Failed to create game session' });
  }
};

export const getGameSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await GameSession.findOne({ sessionId: id });
    if (!session) {
      res.status(404).json({ error: 'Game session not found' });
      return;
    }

    res.json(session);
  } catch (error: any) {
    console.error('Get game session error:', error);
    res.status(500).json({ error: 'Failed to fetch game session' });
  }
};

export const updateGameSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const session = await GameSession.findOneAndUpdate(
      { sessionId: id },
      { $set: updates },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ error: 'Game session not found' });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update game session error:', error);
    res.status(500).json({ error: 'Failed to update game session' });
  }
};
