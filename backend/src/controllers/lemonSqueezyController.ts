import { Request, Response } from 'express';
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import Purchase from '../models/Purchase';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

// Product configuration matching frontend Store.tsx
const PRODUCTS: Record<string, { name: string; nameAr: string; games: number; price: number; isUnlimited: boolean }> = {
  pack_3: { name: '3 Games Pack', nameAr: 'حزمة 3 ألعاب', games: 3, price: 1.99, isUnlimited: false },
  pack_7: { name: '7 Games Pack', nameAr: 'حزمة 7 ألعاب', games: 7, price: 3.99, isUnlimited: false },
  pack_10: { name: '10 Games Pack', nameAr: 'حزمة 10 ألعاب', games: 10, price: 5.99, isUnlimited: false },
  unlimited: { name: 'Unlimited Games', nameAr: 'ألعاب غير محدودة', games: 999999, price: 14.99, isUnlimited: true },
};

const getLemonSqueezy = () => {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    return null;
  }
  lemonSqueezySetup({ apiKey });
  return true;
};

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const configured = getLemonSqueezy();
    if (!configured) {
      res.status(503).json({ error: 'LemonSqueezy is not configured' });
      return;
    }

    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { productId } = req.body;

    if (!productId || !PRODUCTS[productId]) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const product = PRODUCTS[productId];
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const variantId = process.env[`LEMONSQUEEZY_VARIANT_${productId.toUpperCase()}`];

    if (!storeId || !variantId) {
      res.status(503).json({ error: 'LemonSqueezy product configuration missing' });
      return;
    }

    // Get user email
    const user = await User.findOne({ uid: userId });
    const customerEmail = user?.email || undefined;

    // Determine success/cancel URLs
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://playsejal.com';

    // Create checkout using LemonSqueezy API
    const { createCheckout } = await import('@lemonsqueezy/lemonsqueezy.js');
    
    const checkout = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: customerEmail,
        custom: {
          userId,
          productId,
          gamesAdded: String(product.games),
          isUnlimited: String(product.isUnlimited),
          productName: product.name,
          price: String(product.price),
        },
      },
      checkoutOptions: {
        embed: false,
        media: false,
        logo: false,
      },
      productOptions: {
        enabledVariants: [Number(variantId)],
        redirectUrl: `${origin}?payment_success=true`,
      },
    });

    if (checkout.error) {
      console.error('LemonSqueezy checkout error:', checkout.error);
      res.status(500).json({ error: 'Failed to create checkout' });
      return;
    }

    const checkoutId = checkout.data?.data?.id;
    const checkoutUrl = checkout.data?.data?.attributes?.url;
    console.log(`🍋 Created LemonSqueezy checkout:`, { checkoutId, checkoutUrl, userId, productId });
    console.log(`🍋 Full checkout response keys:`, JSON.stringify(checkout.data?.data ? Object.keys(checkout.data.data) : 'no data'));

    // Save pending checkout on user so verifySession can grant games after redirect
    const userDoc = await User.findOne({ uid: userId });
    if (userDoc) {
      userDoc.pendingCheckout = {
        checkoutId: String(checkoutId || 'unknown'),
        productId,
        createdAt: new Date(),
      };
      await userDoc.save();
      console.log(`🍋 Saved pendingCheckout:`, JSON.stringify(userDoc.pendingCheckout));
    } else {
      console.error(`❌ User not found when saving pendingCheckout: ${userId}`);
    }

    res.json({
      sessionId: checkoutId,
      url: checkoutUrl,
    });
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const configured = getLemonSqueezy();
    if (!configured) {
      res.status(503).json({ error: 'LemonSqueezy is not configured' });
      return;
    }

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const signature = req.headers['x-signature'] as string;

    if (!secret || !signature) {
      console.error('Missing LemonSqueezy signature or webhook secret');
      res.status(400).json({ error: 'Missing signature or webhook secret' });
      return;
    }

    // Verify webhook signature
    const rawBody = req.body.toString('utf8');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');

    if (digest !== signature) {
      console.error('Invalid webhook signature');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;

    if (eventName === 'order_created') {
      const order = payload.data;
      const { userId, productId, gamesAdded, isUnlimited, productName, price } = order.attributes.custom_data || {};

      if (!userId || !productId) {
        console.error('Missing custom data in LemonSqueezy webhook:', order.id);
        res.status(400).json({ error: 'Missing custom data' });
        return;
      }

      const transactionId = order.id;

      // Check for duplicate purchase
      const existingPurchase = await Purchase.findOne({ userId, transactionId });
      if (existingPurchase) {
        console.log(`⚠️ Purchase ${transactionId} already processed, skipping`);
        res.json({ received: true });
        return;
      }

      // Update user
      const user = await User.findOne({ uid: userId });
      if (!user) {
        console.error(`User ${userId} not found for LemonSqueezy order ${order.id}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const unlimited = isUnlimited === 'true';
      const games = parseInt(gamesAdded || '0', 10);

      if (unlimited) {
        user.isUnlimited = true;
        user.gamesRemaining = 999999;
      } else {
        user.gamesRemaining += games;
      }
      await user.save();

      // Create purchase record
      await Purchase.create({
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        productId,
        productName: productName || productId,
        gamesAdded: games,
        price: parseFloat(price || '0'),
        isUnlimited: unlimited,
        platform: 'web',
        transactionId,
        verified: true,
        verifiedAt: new Date(),
      });

      console.log(`✅ LemonSqueezy webhook: Granted ${unlimited ? 'unlimited' : games + ' games'} to user ${userId} (order ${order.id})`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

export const verifySession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🍋 verifySession called:', { userId: req.user?.uid, body: req.body });

    const userId = req.user?.uid;
    if (!userId) {
      console.error('❌ No user ID in request');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Strategy 1: Check if the webhook already processed a recent purchase for this user.
    const recentPurchase = await Purchase.findOne({
      userId,
      platform: 'web',
      verified: true,
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (recentPurchase) {
      console.log('✅ Found recent webhook-processed purchase:', recentPurchase.transactionId);
      res.json({
        success: true,
        paymentStatus: 'paid',
        productId: recentPurchase.productId,
      });
      return;
    }

    // Strategy 2: Use the pending checkout saved during createCheckoutSession.
    // LemonSqueezy only redirects to redirectUrl on successful payment,
    // so if the user reached payment_success=true, the payment went through.
    // Use atomic findOneAndUpdate to claim the pending checkout (prevents race conditions).
    const user = await User.findOneAndUpdate(
      {
        uid: userId,
        'pendingCheckout.productId': { $exists: true, $ne: null },
      },
      { $unset: { pendingCheckout: 1 } },
      { new: false } // return document BEFORE the update so we can read the pending data
    );

    if (!user) {
      // Either user doesn't exist or no pending checkout
      const userExists = await User.findOne({ uid: userId });
      if (!userExists) {
        console.error('❌ User not found:', userId);
        res.status(404).json({ error: 'User not found' });
      } else {
        console.log('🍋 No pending checkout found for user:', userId);
        res.json({ success: false, paymentStatus: 'pending' });
      }
      return;
    }

    const pending = user.pendingCheckout!;
    console.log('🍋 Claimed pendingCheckout:', JSON.stringify(pending));

    // Check that the pending checkout is not too old (max 1 hour)
    const pendingAge = Date.now() - new Date(pending.createdAt).getTime();
    if (pendingAge > 60 * 60 * 1000) {
      console.log('🍋 Pending checkout is too old, ignoring:', pendingAge, 'ms');
      res.json({ success: false, paymentStatus: 'expired' });
      return;
    }

    const product = PRODUCTS[pending.productId];
    if (!product) {
      console.error('❌ Invalid product in pending checkout:', pending.productId);
      res.json({ success: false, paymentStatus: 'invalid_product' });
      return;
    }

    // Use the checkout ID as the transaction ID for dedup
    const transactionId = `checkout_${pending.checkoutId}`;
    const existingPurchase = await Purchase.findOne({ userId, transactionId });
    if (existingPurchase) {
      console.log('✅ Purchase already processed for this checkout');
      res.json({ success: true, paymentStatus: 'paid', productId: pending.productId });
      return;
    }

    // Grant games atomically
    const updateFields: any = {};
    if (product.isUnlimited) {
      updateFields.isUnlimited = true;
      updateFields.gamesRemaining = 999999;
    } else {
      updateFields.$inc = { gamesRemaining: product.games };
    }

    if (product.isUnlimited) {
      await User.updateOne({ uid: userId }, { $set: { isUnlimited: true, gamesRemaining: 999999 } });
    } else {
      await User.updateOne({ uid: userId }, { $inc: { gamesRemaining: product.games } });
    }
    console.log(`✅ Games granted: +${product.isUnlimited ? 'unlimited' : product.games}`);

    // Create purchase record
    await Purchase.create({
      id: `purchase_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      userId,
      productId: pending.productId,
      productName: product.name,
      gamesAdded: product.games,
      price: product.price,
      isUnlimited: product.isUnlimited,
      platform: 'web',
      transactionId,
      verified: true,
      verifiedAt: new Date(),
    });

    console.log(`✅ LemonSqueezy verify: Granted ${product.isUnlimited ? 'unlimited' : product.games + ' games'} to user ${userId} via pending checkout`);

    res.json({
      success: true,
      paymentStatus: 'paid',
      productId: pending.productId,
    });
  } catch (error: any) {
    console.error('Verify session error:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
};
