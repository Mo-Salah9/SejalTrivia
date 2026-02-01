import { Response } from 'express';
import Purchase from '../models/Purchase';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { verifyAppleReceipt } from '../services/appleReceipt';
import { verifyGooglePlayPurchase } from '../services/googlePlayReceipt';

export const verifyPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { platform, receipt, productId, transactionId } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!platform || !receipt || !productId || !transactionId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check for duplicate purchase
    const existing = await Purchase.findOne({ userId, transactionId });
    if (existing) {
      res.json({ verified: true, alreadyProcessed: true, purchaseId: existing.id });
      return;
    }

    let verified = false;

    if (platform === 'ios') {
      const result = await verifyAppleReceipt(receipt, productId, transactionId);
      verified = result.verified;

      if (!verified) {
        res.status(400).json({ verified: false, error: result.error });
        return;
      }
    } else if (platform === 'android') {
      // Verify Google Play purchase
      const packageName = req.body.packageName || 'com.falsafa.trivia';
      const result = await verifyGooglePlayPurchase(receipt, productId, packageName);
      verified = result.verified;

      if (!verified) {
        res.status(400).json({ verified: false, error: result.error || 'Google Play verification failed' });
        return;
      }
    } else {
      res.status(400).json({ error: 'Invalid platform' });
      return;
    }

    // Record purchase
    const purchase = await Purchase.create({
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      productId,
      productName: productId,
      gamesAdded: 0, // Will be set by processPurchase
      price: 0,
      isUnlimited: false,
      platform,
      transactionId,
      receipt,
      verified: true,
      verifiedAt: new Date(),
    });

    res.json({ verified: true, purchaseId: purchase.id });
  } catch (error: any) {
    console.error('Verify purchase error:', error);
    res.status(500).json({ error: 'Purchase verification failed' });
  }
};

export const processPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, productId, productName, gamesAdded, price, isUnlimited, transactionId, platform } = req.body;

    if (!userId || !productId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const user = await User.findOne({ uid: userId });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if this purchase was already processed
    // If transactionId is provided, check if we've already processed it
    let purchaseAlreadyProcessed = false;
    if (transactionId) {
      const existingPurchase = await Purchase.findOne({ userId, transactionId });
      if (existingPurchase) {
        // Purchase record exists - check if games were already added
        // If gamesAdded matches what we're trying to add, it's already processed
        if (existingPurchase.gamesAdded === gamesAdded && existingPurchase.isUnlimited === isUnlimited) {
          purchaseAlreadyProcessed = true;
          console.log(`⚠️ Purchase ${transactionId} already processed with same values, skipping game addition`);
        } else if (existingPurchase.gamesAdded > 0 && !isUnlimited) {
          // If it's a game pack purchase and games were already added, don't add again
          purchaseAlreadyProcessed = true;
          console.log(`⚠️ Purchase ${transactionId} already processed (gamesAdded: ${existingPurchase.gamesAdded}), skipping game addition`);
        } else if (existingPurchase.isUnlimited && isUnlimited) {
          // If unlimited was already granted, don't process again
          purchaseAlreadyProcessed = true;
          console.log(`⚠️ Purchase ${transactionId} already processed (unlimited), skipping`);
        }
      }
    }

    // Update user game data (only if not already processed)
    if (!purchaseAlreadyProcessed) {
      if (isUnlimited) {
        user.isUnlimited = true;
        user.gamesRemaining = 999999;
      } else {
        user.gamesRemaining += gamesAdded;
      }
      await user.save();
    } else {
      // Even if already processed, ensure unlimited status is set
      if (isUnlimited && !user.isUnlimited) {
        user.isUnlimited = true;
        user.gamesRemaining = 999999;
        await user.save();
      }
    }

    // Create or update Purchase record
    // If transactionId is provided, try to find existing purchase from verifyPurchase
    let purchase;
    if (transactionId) {
      purchase = await Purchase.findOne({ userId, transactionId });
    }

    if (purchase) {
      // Update existing purchase with correct data
      purchase.productName = productName || purchase.productName;
      purchase.gamesAdded = gamesAdded;
      purchase.price = price || 0;
      purchase.isUnlimited = isUnlimited;
      await purchase.save();
      console.log(`✅ Updated purchase record ${purchase.id} for user ${userId}`);
    } else {
      // Create new purchase record if it doesn't exist
      purchase = await Purchase.create({
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        productId,
        productName: productName || productId,
        gamesAdded,
        price: price || 0,
        isUnlimited,
        platform: platform || 'ios',
        transactionId: transactionId || `txn_${Date.now()}`,
        verified: true,
        verifiedAt: new Date(),
      });
      console.log(`✅ Created purchase record ${purchase.id} for user ${userId}`);
    }

    console.log(`✅ Processed purchase for user ${userId}: +${gamesAdded} games, isUnlimited: ${isUnlimited}`);

    res.json({ success: true, purchaseId: purchase.id });
  } catch (error: any) {
    console.error('Process purchase error:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
};

export const getUserPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const purchases = await Purchase.find({ userId })
      .sort({ createdAt: -1 })
      .select('-_id -__v -receipt');

    res.json(purchases);
  } catch (error: any) {
    console.error('Get user purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
};
