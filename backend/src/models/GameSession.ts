import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
  sessionId: string;
  userId: string;
  players: any[];
  currentTurn: number;
  categories: any;
  activeQuestion: {
    categoryId: string;
    questionId: string;
  } | null;
  language: 'en' | 'ar';
  status: 'active' | 'completed' | 'abandoned';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameSessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  players: [{ type: Schema.Types.Mixed }],
  currentTurn: { type: Number, required: true },
  categories: { type: Schema.Types.Mixed },
  activeQuestion: {
    categoryId: { type: String },
    questionId: { type: String },
  },
  language: { type: String, enum: ['en', 'ar'], default: 'ar' },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active', index: true },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt timestamp on save
GameSessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);
