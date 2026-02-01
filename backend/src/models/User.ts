import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  email: string;
  passwordHash?: string;
  displayName: string | null;
  photoURL: string | null;
  provider: 'email' | 'google' | 'apple';
  googleId?: string;
  appleId?: string;
  isAdmin: boolean;
  gamesRemaining: number;
  isUnlimited: boolean;
  totalGamesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
  // Email verification fields
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // Pending LemonSqueezy checkout (cleared after verification)
  pendingCheckout?: {
    checkoutId: string;
    productId: string;
    createdAt: Date;
  };
}

const UserSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String },
  displayName: { type: String, default: null },
  photoURL: { type: String, default: null },
  provider: { type: String, enum: ['email', 'google', 'apple'], required: true },
  googleId: { type: String, index: true },
  appleId: { type: String, index: true },
  isAdmin: { type: Boolean, default: false, index: true },
  gamesRemaining: { type: Number, default: 3 },
  isUnlimited: { type: Boolean, default: false },
  totalGamesPlayed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Email verification fields
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  // Password reset fields
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  // Pending LemonSqueezy checkout (cleared after verification)
  pendingCheckout: {
    checkoutId: { type: String },
    productId: { type: String },
    createdAt: { type: Date },
  },
});

// Update the updatedAt timestamp on save
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IUser>('User', UserSchema);
