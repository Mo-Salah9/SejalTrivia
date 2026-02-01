import { Response } from 'express';
import User from '../models/User';
import Purchase from '../models/Purchase';
import { AuthRequest } from '../middleware/auth';

export const getAdminList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admins = await User.find({ isAdmin: true }).select('uid email');

    const uids = admins.map((admin) => admin.uid);
    const emails = admins.map((admin) => admin.email);

    res.json({ uids, emails });
  } catch (error: any) {
    console.error('Get admin list error:', error);
    res.status(500).json({ error: 'Failed to fetch admin list' });
  }
};

export const grantAdminStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isAdmin = true;
    await user.save();

    console.log(`✅ Granted admin status to user: ${user.email}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Grant admin status error:', error);
    res.status(500).json({ error: 'Failed to grant admin status' });
  }
};

export const revokeAdminStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isAdmin = false;
    await user.save();

    console.log(`✅ Revoked admin status from user: ${user.email}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Revoke admin status error:', error);
    res.status(500).json({ error: 'Failed to revoke admin status' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.json(users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      provider: user.provider,
      isAdmin: user.isAdmin,
      gamesRemaining: user.gamesRemaining,
      isUnlimited: user.isUnlimited,
      totalGamesPlayed: user.totalGamesPlayed,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })));
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;
    const { gamesRemaining, isUnlimited, isAdmin } = req.body;

    const user = await User.findOne({ uid });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (gamesRemaining !== undefined) user.gamesRemaining = gamesRemaining;
    if (isUnlimited !== undefined) user.isUnlimited = isUnlimited;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;

    await user.save();

    console.log(`✅ Updated user: ${user.email}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { uid } = req.params;

    const result = await User.deleteOne({ uid });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log(`✅ Deleted user: ${uid}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const getAllPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const purchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .select('-_id -__v -receipt')
      .limit(1000); // Limit to prevent huge responses

    // Populate user email for easier viewing
    const purchasesWithUserInfo = await Promise.all(
      purchases.map(async (purchase) => {
        const user = await User.findOne({ uid: purchase.userId }).select('email displayName');
        return {
          id: purchase.id,
          userId: purchase.userId,
          userEmail: user?.email || 'Unknown',
          userDisplayName: user?.displayName || 'Unknown',
          productId: purchase.productId,
          productName: purchase.productName,
          gamesAdded: purchase.gamesAdded,
          price: purchase.price,
          isUnlimited: purchase.isUnlimited,
          platform: purchase.platform,
          transactionId: purchase.transactionId,
          verified: purchase.verified,
          verifiedAt: purchase.verifiedAt,
          createdAt: purchase.createdAt,
        };
      })
    );

    res.json(purchasesWithUserInfo);
  } catch (error: any) {
    console.error('Get all purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
};
