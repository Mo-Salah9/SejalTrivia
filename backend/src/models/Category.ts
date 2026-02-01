import mongoose, { Schema, Document } from 'mongoose';

interface IQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
  isSolved: boolean;
}

export interface ICategory extends Document {
  id: string;
  name: string;
  nameAr?: string;
  enabled: boolean;
  mainKey?: string;
  mainNameEn?: string;
  mainNameAr?: string;
  subNameEn?: string;
  subNameAr?: string;
  sortOrder?: number;
  imageUrl?: string;
  iconUrl?: string;
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const QuestionSchema: Schema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  points: { type: Number, required: true },
  isSolved: { type: Boolean, default: false },
}, { _id: false });

const CategorySchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  nameAr: { type: String },
  enabled: { type: Boolean, default: true },
  mainKey: { type: String },
  mainNameEn: { type: String },
  mainNameAr: { type: String },
  subNameEn: { type: String },
  subNameAr: { type: String },
  sortOrder: { type: Number, default: 0 },
  imageUrl: { type: String },
  iconUrl: { type: String },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 0 },
});

// Update the updatedAt timestamp and increment version on save
CategorySchema.pre('save', function (this: ICategory, next) {
  this.updatedAt = new Date();
  this.version += 1;
  next();
});

export default mongoose.model<ICategory>('Category', CategorySchema);
