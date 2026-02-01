import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trivia-game';

    // Helpful validation (prevents confusing crash loops in production)
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      const preview = mongoUri.slice(0, 40).replace(/\/\/.*@/, '//***@');
      console.error('❌ Invalid MONGODB_URI scheme.');
      console.error('   It must start with "mongodb://" or "mongodb+srv://".');
      console.error(`   Got: "${preview}${mongoUri.length > 40 ? '…' : ''}"`);
      console.error('   Tip: In Railway Variables, set MONGODB_URI to ONLY the URI value (no quotes, no "MONGODB_URI=" prefix).');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);

    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db?.databaseName || 'unknown');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});
