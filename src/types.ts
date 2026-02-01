
export type Language = 'en' | 'ar';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
  isSolved: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  /** If false, hide this category from normal gameplay */
  enabled?: boolean;
  /** Main grouping key (e.g. hadith/fiqh/aqeedah/history/arabic) */
  mainKey?: string;
  mainNameEn?: string;
  mainNameAr?: string;
  subNameEn?: string;
  subNameAr?: string;
  sortOrder?: number;
  /** Card thumbnail image URL */
  imageUrl?: string;
  /** Optional small icon URL */
  iconUrl?: string;
  questions: Question[];
}

export type PerkType = 'show_options' | 'two_answers' | 'the_pit';

export interface Player {
  id: number;
  name: string;
  score: number;
  turnsTaken: number;
  perksUsed: {
    show_options: boolean;
    two_answers: boolean;
    the_pit: boolean;
  };
}

export type ViewState = 'landing' | 'home' | 'game' | 'gameLoading' | 'admin' | 'gameOver' | 'login' | 'signup' | 'forgotPassword' | 'verifyEmail' | 'profile' | 'store';

export interface PurchaseProduct {
  id: string;
  name: string;
  nameAr: string;
  games: number;
  price: number;
  isUnlimited: boolean;
}

export interface GameState {
  players: Player[];
  currentTurn: number;
  categories: Category[];
  activeQuestion: { categoryId: string; questionId: string } | null;
  view: ViewState;
  language: Language;
}
