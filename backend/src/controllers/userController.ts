import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ uid: id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      isAdmin: user.isAdmin,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (error: any) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
};

export const getUserGameData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ uid: id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      gamesRemaining: user.gamesRemaining,
      isUnlimited: user.isUnlimited,
      totalGamesPlayed: user.totalGamesPlayed,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error: any) {
    console.error('Get user game data error:', error);
    res.status(500).json({ error: 'Failed to fetch user game data' });
  }
};

export const startGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ uid: id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // If unlimited, just increment total played
    if (user.isUnlimited) {
      user.totalGamesPlayed += 1;
      await user.save();
      res.json({ success: true, gamesRemaining: user.gamesRemaining });
      return;
    }

    // Check if user has games remaining
    if (user.gamesRemaining <= 0) {
      res.status(403).json({ error: 'No games remaining' });
      return;
    }

    // Decrement games and increment total played
    user.gamesRemaining -= 1;
    user.totalGamesPlayed += 1;
    await user.save();

    res.json({ success: true, gamesRemaining: user.gamesRemaining });
  } catch (error: any) {
    console.error('Start game error:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
};

export const initializeUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    let user = await User.findOne({ uid: id });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // If user already has data, return it
    if (user.gamesRemaining > 0 || user.isUnlimited || user.totalGamesPlayed > 0) {
      res.json({
        gamesRemaining: user.gamesRemaining,
        isUnlimited: user.isUnlimited,
        totalGamesPlayed: user.totalGamesPlayed,
      });
      return;
    }

    // Give free games
    user.gamesRemaining = parseInt(process.env.INITIAL_FREE_GAMES || '3');
    await user.save();

    res.json({
      gamesRemaining: user.gamesRemaining,
      isUnlimited: user.isUnlimited,
      totalGamesPlayed: user.totalGamesPlayed,
    });
  } catch (error: any) {
    console.error('Initialize user error:', error);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
};
