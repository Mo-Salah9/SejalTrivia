import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Category from '../models/Category';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// High-quality, culturally appropriate images from Unsplash
// All images are optimized for 800px width with quality 80
const categoryImages: Record<string, string> = {
  // عام (General)
  'cat_1': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', // معلومات عامة - Globe/World Knowledge
  'cat_2': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80', // جغرافيا - Earth/Geography Map
  'cat_3': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80', // علوم - Science/Physics Molecules
  
  // ترفيه (Entertainment)
  'cat_4': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80', // أفلام - Cinema/Movie Theater
  'cat_5': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', // موسيقى - Music/Musical Instruments
  'cat_6': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80', // رياضة - Sports/Soccer Ball
  
  // إسلامي (Islamic) - Using Islamic calligraphy and architecture
  'cat_7': 'https://images.unsplash.com/photo-1601741374982-0d9e8b49b0e5?w=800&q=80', // قرآن - Quran/Islamic Calligraphy
  'cat_8': 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800&q=80', // حديث - Hadith/Ancient Scroll
  'cat_9': 'https://images.unsplash.com/photo-1601741374982-0d9e8b49b0e5?w=800&q=80', // فقه - Fiqh/Islamic Law Books
  'cat_10': 'https://images.unsplash.com/photo-1601741374982-0d9e8b49b0e5?w=800&q=80', // سيرة - Seerah/Prophet History
  
  // ثقافة (Culture)
  'cat_11': 'https://images.unsplash.com/photo-1481627834876-b7833e58f587?w=800&q=80', // تاريخ - History/Ancient Architecture
  'cat_12': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', // أدب - Literature/Stack of Books
  'cat_13': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', // تكنولوجيا - Technology/Circuit Board
  'cat_14': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80', // ثقافة عربية - Arab Culture/Mosque Dome
};

async function addImages() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    console.log('🖼️  Adding images to categories...\n');

    let updatedCount = 0;

    // Update all categories, even if they already have images (to use better URLs)
    for (const [categoryId, imageUrl] of Object.entries(categoryImages)) {
      const category = await Category.findOne({ id: categoryId });
      
      if (category) {
        const hadImage = !!category.imageUrl;
        category.imageUrl = imageUrl;
        await category.save();
        console.log(`${hadImage ? '🔄 Updated' : '✅ Added'} image to: ${category.nameAr || category.name}`);
        updatedCount++;
      } else {
        console.log(`⚠️  Category ${categoryId} not found`);
      }
    }

    console.log(`\n🎉 Done! Updated ${updatedCount} categories with images!`);
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding images:', error);
    process.exit(1);
  }
}

addImages();
