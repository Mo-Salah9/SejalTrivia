import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Category from '../models/Category';

dotenv.config();

interface DatabaseQuestion {
  id: number;
  q: string;
  level: number;
  link?: string;
  section?: string;
  answers: Array<{
    answer: string;
    t: number; // 1 for correct, 0 for wrong
  }>;
}

interface CategoryMetadata {
  englishName: string;
  arabicName: string;
  files: Array<{
    level: number;
    filename: string;
    path: string;
  }>;
}

interface MainCategoryData {
  id: number;
  category: string;
  description: string;
  icons: string;
  DataArray: CategoryMetadata[];
}

// Point values based on level (matching game format: 200, 400, 600)
const LEVEL_POINTS: Record<number, number> = {
  1: 200,
  2: 400,
  3: 600,
};

// Main category names mapping
const MAIN_CATEGORY_NAMES: Record<string, { en: string; ar: string }> = {
  akida: { en: 'Aqeedah', ar: 'العقيدة' },
  arabia: { en: 'Arabic Language', ar: 'اللغة العربية' },
  figh: { en: 'Fiqh', ar: 'الفقه' },
  hadith: { en: 'Hadith', ar: 'الحديث' },
  history: { en: 'History', ar: 'التاريخ' },
};

async function importIslamicData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trivia-game';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Path to database folder (relative to project root)
    // When running with ts-node, __dirname is src/scripts
    // When running compiled, __dirname is dist/scripts
    // Go up to project root, then into database folder
    const projectRoot = path.resolve(__dirname, '../../..');
    const databasePath = path.join(projectRoot, 'database');
    
    if (!fs.existsSync(databasePath)) {
      console.error(`❌ Database folder not found at: ${databasePath}`);
      process.exit(1);
    }

    console.log(`📂 Reading database from: ${databasePath}`);

    // Clear existing categories
    console.log('🗑️  Clearing existing categories...');
    await Category.deleteMany({});
    console.log('✅ Existing categories cleared');

    const allCategories: any[] = [];
    let categoryCounter = 1;

    // Process each main category
    const mainCategories = ['akida', 'arabia', 'figh', 'hadith', 'history'];
    
    for (const mainCat of mainCategories) {
      const categoryJsonPath = path.join(databasePath, `${mainCat}.json`);
      
      if (!fs.existsSync(categoryJsonPath)) {
        console.warn(`⚠️  Category file not found: ${categoryJsonPath}`);
        continue;
      }

      console.log(`\n📖 Processing ${mainCat}...`);
      const categoryData: MainCategoryData = JSON.parse(
        fs.readFileSync(categoryJsonPath, 'utf-8')
      );

      const mainCategoryName = MAIN_CATEGORY_NAMES[mainCat] || {
        en: mainCat,
        ar: categoryData.category || mainCat,
      };

      // Process each subcategory
      for (const subcategory of categoryData.DataArray || []) {
        const subcategoryPath = path.join(databasePath, mainCat, subcategory.englishName);
        
        if (!fs.existsSync(subcategoryPath)) {
          console.warn(`⚠️  Subcategory folder not found: ${subcategoryPath}`);
          continue;
        }

        // Collect all questions from all levels
        const allQuestions: any[] = [];

        for (const fileInfo of subcategory.files || []) {
          const filePath = path.join(databasePath, mainCat, subcategory.englishName, fileInfo.filename);
          
          if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  Level file not found: ${filePath}`);
            continue;
          }

          try {
            const questions: DatabaseQuestion[] = JSON.parse(
              fs.readFileSync(filePath, 'utf-8')
            );

            const questionsBefore = allQuestions.length;

            // Convert to game format
            for (const q of questions) {
              // Validate question text
              if (!q.q || typeof q.q !== 'string' || q.q.trim().length === 0) {
                console.warn(`⚠️  Question ${q.id} has empty text, skipping`);
                continue;
              }

              // Filter out empty/null answers and validate
              const validAnswers = q.answers.filter(
                (a) => a && a.answer && typeof a.answer === 'string' && a.answer.trim().length > 0
              );

              if (validAnswers.length < 2) {
                console.warn(`⚠️  Question ${q.id} has less than 2 valid answers, skipping`);
                continue;
              }

              // Find correct answer index in valid answers
              const correctIndex = validAnswers.findIndex((a) => a.t === 1);
              
              if (correctIndex === -1) {
                console.warn(`⚠️  Question ${q.id} has no correct answer, skipping`);
                continue;
              }

              // Shuffle answers to randomize correct answer position
              const shuffledAnswers = [...validAnswers];
              for (let i = shuffledAnswers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
              }

              // Map to options array and ensure all are non-empty strings
              const options: string[] = [];
              let finalCorrectIndex = -1;
              
              for (let i = 0; i < shuffledAnswers.length; i++) {
                const answer = shuffledAnswers[i].answer.trim();
                if (answer.length > 0) {
                  if (shuffledAnswers[i].t === 1) {
                    finalCorrectIndex = options.length;
                  }
                  options.push(answer);
                }
              }

              if (options.length < 2) {
                console.warn(`⚠️  Question ${q.id} has less than 2 valid options after processing, skipping`);
                continue;
              }

              if (finalCorrectIndex === -1) {
                console.warn(`⚠️  Question ${q.id} lost correct answer after processing, skipping`);
                continue;
              }

              allQuestions.push({
                id: `q_${q.id}_${q.level}`,
                text: q.q.trim(),
                options: options,
                correctIndex: finalCorrectIndex,
                points: LEVEL_POINTS[q.level] || 200,
                isSolved: false,
              });
            }

            const questionsAdded = allQuestions.length - questionsBefore;
            if (questionsAdded < questions.length) {
              console.log(`  ✓ Loaded ${questionsAdded}/${questions.length} valid questions from ${fileInfo.filename} (${questions.length - questionsAdded} skipped)`);
            } else {
              console.log(`  ✓ Loaded ${questionsAdded} questions from ${fileInfo.filename}`);
            }
          } catch (error: any) {
            console.error(`❌ Error reading ${filePath}:`, error.message);
          }
        }

        if (allQuestions.length === 0) {
          console.warn(`⚠️  No questions found for ${subcategory.englishName}, skipping`);
          continue;
        }

        // Create category name
        const categoryName = `${mainCategoryName.en} - ${subcategory.englishName}`;
        const categoryNameAr = `${mainCategoryName.ar} - ${subcategory.arabicName}`;

        // Create category object
        const category = {
          id: `cat_${categoryCounter++}`,
          name: categoryName,
          nameAr: categoryNameAr,
          enabled: true,
          mainKey: mainCat,
          mainNameEn: mainCategoryName.en,
          mainNameAr: mainCategoryName.ar,
          subNameEn: subcategory.englishName,
          subNameAr: subcategory.arabicName,
          sortOrder: categoryCounter,
          questions: allQuestions,
        };

        allCategories.push(category);
        console.log(`  ✅ Created category: ${categoryNameAr} (${allQuestions.length} questions)`);
      }
    }

    if (allCategories.length === 0) {
      console.error('❌ No categories to import!');
      process.exit(1);
    }

    // Quick validation check
    console.log(`\n🔍 Validating ${allCategories.length} categories...`);
    let invalidCount = 0;
    for (const cat of allCategories) {
      for (const q of cat.questions) {
        if (!q.options || q.options.length < 2 || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
          invalidCount++;
        }
      }
    }
    if (invalidCount > 0) {
      console.warn(`⚠️  Found ${invalidCount} potentially invalid questions (will be caught during import)`);
    } else {
      console.log(`✅ All questions passed basic validation`);
    }

    // Import to database
    console.log(`\n📤 Importing ${allCategories.length} categories to database...`);
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < allCategories.length; i++) {
      const cat = allCategories[i];
      try {
        // Validate category before inserting
        const categoryDoc = new Category(cat);
        await categoryDoc.validate();
        await categoryDoc.save();
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`  ✓ Imported ${i + 1}/${allCategories.length} categories...`);
        }
      } catch (error: any) {
        failCount++;
        console.error(`❌ Failed to import category "${cat.name}" (${cat.nameAr}):`, error.message);
        if (error.errors) {
          Object.keys(error.errors).forEach(key => {
            console.error(`   - ${key}: ${error.errors[key].message}`);
          });
        }
        // Continue with next category instead of stopping
      }
    }
    
    console.log(`\n✅ Successfully imported ${successCount} categories`);
    if (failCount > 0) {
      console.log(`⚠️  Failed to import ${failCount} categories`);
    }

    // Count total questions from successfully imported categories
    const importedCategories = await Category.find().select('questions');
    const totalQuestions = importedCategories.reduce((sum, cat) => sum + (cat.questions?.length || 0), 0);
    console.log(`📊 Total questions in database: ${totalQuestions}`);

    // Verify import
    const verifyCount = await Category.countDocuments();
    if (verifyCount !== successCount) {
      console.warn(`⚠️  Import verification: Expected ${successCount} categories, found ${verifyCount}`);
    } else {
      console.log(`✅ Verified: ${verifyCount} categories in database`);
    }

    // Delete database folder only if import was successful
    if (failCount === 0) {
      console.log('\n🗑️  Deleting database folder...');
      try {
        deleteFolderRecursive(databasePath);
        console.log('✅ Database folder deleted successfully!');
      } catch (error: any) {
        console.error(`⚠️  Error deleting database folder: ${error.message}`);
        console.log('⚠️  You may need to manually delete the database folder');
      }
    } else {
      console.log(`\n⚠️  Skipping database folder deletion due to ${failCount} failed imports`);
      console.log('⚠️  Please review the errors above and fix any issues before deleting the folder');
    }

    // Close database connection
    await mongoose.connection.close();
    console.log('\n🎉 Import completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

function deleteFolderRecursive(folderPath: string) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

// Run the import
importIslamicData();
