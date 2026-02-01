import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

async function createAdmin(email: string) {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trivia-game';
    await mongoose.connect(mongoUri);

    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('💡 Please sign up first, then run this script again');
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log(`ℹ️  User ${email} is already an admin`);
      process.exit(0);
    }

    user.isAdmin = true;
    await user.save();

    console.log(`✅ Admin status granted to ${email}`);
    console.log(`   UID: ${user.uid}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run create-admin <email>');
  process.exit(1);
}

createAdmin(email);
