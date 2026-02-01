/**
 * Clear all purchases and reset user game data for testing
 * 
 * Usage: npm run clear-purchases
 * 
 * WARNING: This will delete ALL purchases and reset all users' game counts!
 * Only use this for testing/development.
 */

import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import Purchase from '../models/Purchase';
import User from '../models/User';

dotenv.config();

async function clearPurchases() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDatabase();

    // Delete all purchases
    console.log('🗑️  Deleting all purchases...');
    const purchaseResult = await Purchase.deleteMany({});
    console.log(`✅ Deleted ${purchaseResult.deletedCount} purchases`);

    // Reset all users' game data
    console.log('🔄 Resetting user game data...');
    const userResult = await User.updateMany(
      {},
      {
        $set: {
          gamesRemaining: parseInt(process.env.INITIAL_FREE_GAMES || '3'),
          isUnlimited: false,
        },
      }
    );
    console.log(`✅ Reset game data for ${userResult.modifiedCount} users`);

    console.log('\n✅ All purchases cleared and user game data reset!');
    console.log('📊 Users now have:', process.env.INITIAL_FREE_GAMES || '3', 'free games');
    console.log('📊 Unlimited access: false for all users');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing purchases:', error);
    process.exit(1);
  }
}

// Run the script
clearPurchases();
