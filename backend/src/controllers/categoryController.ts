import { Response } from 'express';
import Category from '../models/Category';
import { AuthRequest } from '../middleware/auth';

// SSE clients storage
const sseClients: Response[] = [];

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().select('-_id -__v -createdAt -updatedAt -version');

    res.json({ categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const saveCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      res.status(400).json({ error: 'Categories array is required' });
      return;
    }

    // SAFETY CHECK: Prevent accidental deletion of all categories
    if (categories.length === 0) {
      res.status(400).json({
        error: 'Cannot save empty categories array. This would delete all existing categories. If you want to delete all categories, use a dedicated delete endpoint.'
      });
      return;
    }

    // Get current category count for safety logging
    const existingCount = await Category.countDocuments();

    // SAFETY CHECK: Warn if saving significantly fewer categories than exist
    if (existingCount > 0 && categories.length < existingCount * 0.5) {
      console.warn(`⚠️ WARNING: Attempting to save ${categories.length} categories when ${existingCount} exist. This will delete ${existingCount - categories.length} categories.`);
    }

    // Use upsert pattern instead of delete-all-then-insert for safer updates
    const bulkOps = categories.map((cat: any) => ({
      updateOne: {
        filter: { id: cat.id },
        update: {
          $set: {
            id: cat.id,
            name: cat.name,
            nameAr: cat.nameAr,
            enabled: cat.enabled ?? true,
            mainKey: cat.mainKey,
            mainNameEn: cat.mainNameEn,
            mainNameAr: cat.mainNameAr,
            subNameEn: cat.subNameEn,
            subNameAr: cat.subNameAr,
            sortOrder: typeof cat.sortOrder === 'number' ? cat.sortOrder : 0,
            imageUrl: cat.imageUrl,
            iconUrl: cat.iconUrl,
            questions: cat.questions,
          }
        },
        upsert: true
      }
    }));

    // Get the IDs being saved
    const savedIds = categories.map((cat: any) => cat.id);

    // Perform bulk upsert
    const result = await Category.bulkWrite(bulkOps);

    // Remove categories that are no longer in the list (but only if we have a valid list)
    const deleteResult = await Category.deleteMany({ id: { $nin: savedIds } });

    console.log(`✅ Saved ${categories.length} categories (${result.upsertedCount} new, ${result.modifiedCount} updated, ${deleteResult.deletedCount} removed)`);

    // Notify SSE clients
    notifySSEClients();

    res.json({
      success: true,
      count: categories.length,
      details: {
        new: result.upsertedCount,
        updated: result.modifiedCount,
        removed: deleteResult.deletedCount
      }
    });
  } catch (error: any) {
    console.error('Save categories error:', error);
    res.status(500).json({ error: 'Failed to save categories' });
  }
};

export const subscribeToCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial data
  try {
    const categories = await Category.find().select('-_id -__v -createdAt -updatedAt -version');
    res.write(`data: ${JSON.stringify({ categories })}\n\n`);
  } catch (error) {
    console.error('Error sending initial categories:', error);
  }

  // Add client to list
  sseClients.push(res);
  console.log(`📡 SSE client connected (total: ${sseClients.length})`);

  // Remove client on disconnect
  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index > -1) {
      sseClients.splice(index, 1);
    }
    console.log(`📡 SSE client disconnected (total: ${sseClients.length})`);
  });
};

// Helper function to notify all SSE clients
async function notifySSEClients() {
  if (sseClients.length === 0) return;

  try {
    const categories = await Category.find().select('-_id -__v -createdAt -updatedAt -version');
    const data = JSON.stringify({ categories });

    sseClients.forEach((client) => {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (error) {
        console.error('Error sending SSE update:', error);
      }
    });

    console.log(`📡 Notified ${sseClients.length} SSE clients`);
  } catch (error) {
    console.error('Error notifying SSE clients:', error);
  }
}
