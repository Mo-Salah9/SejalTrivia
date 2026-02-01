import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchase extends Document {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  gamesAdded: number;
  price: number;
  isUnlimited: boolean;
  platform: 'ios' | 'android' | 'web';
  transactionId: string;
  receipt?: any;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

const PurchaseSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  gamesAdded: { type: Number, required: true },
  price: { type: Number, default: 0 },
  isUnlimited: { type: Boolean, default: false },
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  transactionId: { type: String, required: true, index: true },
  receipt: { type: Schema.Types.Mixed },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index for duplicate purchase detection
PurchaseSchema.index({ userId: 1, transactionId: 1 }, { unique: true });

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);
