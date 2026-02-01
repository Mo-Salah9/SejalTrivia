/**
 * Backend Service Layer
 * REST API calls to custom backend
 */

import {apiService} from './apiService';
import {Category, GameState} from '../types';

/**
 * Categories Service
 */
export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiService.get<{categories: Category[]}>(
        '/categories',
      );
      return response.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  async saveCategories(categories: Category[]): Promise<boolean> {
    try {
      await apiService.post('/categories', {categories});
      return true;
    } catch (error) {
      console.error('Error saving categories:', error);
      return false;
    }
  },

  /**
   * Subscribe to category updates via polling (replaces SSE EventSource)
   */
  subscribeToCategories(
    callback: (categories: Category[]) => void,
    intervalMs: number = 30000,
  ): () => void {
    let active = true;

    const poll = async () => {
      if (!active) {
        return;
      }
      try {
        const categories = await this.getCategories();
        if (categories && categories.length > 0 && active) {
          callback(categories);
        }
      } catch (error) {
        console.debug('Category polling error:', error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const interval = setInterval(poll, intervalMs);

    return () => {
      active = false;
      clearInterval(interval);
    };
  },
};

/**
 * Game Sessions Service
 */
export const gameSessionsService = {
  async saveGameSession(
    gameState: GameState,
    sessionId?: string,
  ): Promise<string> {
    try {
      const id =
        sessionId ||
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await apiService.post<{sessionId: string}>(
        '/game-sessions',
        {
          ...gameState,
          sessionId: id,
        },
      );

      return response.sessionId || id;
    } catch (error) {
      console.error('Error saving game session:', error);
      throw error;
    }
  },

  async getGameSession(sessionId: string): Promise<GameState | null> {
    try {
      return await apiService.get<GameState>(`/game-sessions/${sessionId}`);
    } catch (error) {
      console.error('Error fetching game session:', error);
      return null;
    }
  },

  async updateGameSession(
    sessionId: string,
    gameState: Partial<GameState>,
  ): Promise<boolean> {
    try {
      await apiService.patch(`/game-sessions/${sessionId}`, gameState);
      return true;
    } catch (error) {
      console.error('Error updating game session:', error);
      return false;
    }
  },
};

/**
 * Admin Service
 */
export const adminService = {
  async isAdmin(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        return false;
      }
      const response = await apiService.get<{isAdmin: boolean}>(
        `/users/${userId}`,
      );
      return response.isAdmin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  async getAdminList(): Promise<{emails: string[]; uids: string[]}> {
    try {
      return await apiService.get<{emails: string[]; uids: string[]}>(
        '/admin/admins',
      );
    } catch (error) {
      console.error('Error getting admin list:', error);
      return {emails: [], uids: []};
    }
  },

  async addAdmin(uid: string, email?: string): Promise<boolean> {
    try {
      if (!uid || !uid.trim()) {
        return false;
      }
      await apiService.post(`/admin/users/${uid}/admin`, {email});
      return true;
    } catch (error) {
      console.error('Error setting admin:', error);
      return false;
    }
  },

  async removeAdmin(uid: string): Promise<boolean> {
    try {
      if (!uid || !uid.trim()) {
        return false;
      }
      await apiService.delete(`/admin/users/${uid}/admin`);
      return true;
    } catch (error) {
      console.error('Error removing admin:', error);
      return false;
    }
  },
};

/**
 * Settings Service
 */
export const settingsService = {
  async getSettings(): Promise<any> {
    try {
      return await apiService.get('/settings');
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  },

  async saveSettings(settings: any): Promise<boolean> {
    try {
      await apiService.patch('/settings', settings);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },
};

/**
 * User Service
 */
export interface UserGameData {
  gamesRemaining: number;
  isUnlimited: boolean;
  totalGamesPlayed: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  gamesAdded: number;
  price: number;
  isUnlimited: boolean;
  createdAt?: any;
}

export const userService = {
  async initializeUser(userId: string): Promise<UserGameData> {
    try {
      return await apiService.post<UserGameData>(
        `/users/${userId}/initialize`,
      );
    } catch (error) {
      console.error('Error initializing user:', error);
      return {
        gamesRemaining: 3,
        isUnlimited: false,
        totalGamesPlayed: 0,
      };
    }
  },

  async getUserGameData(userId: string): Promise<UserGameData | null> {
    try {
      return await apiService.get<UserGameData>(
        `/users/${userId}/game-data`,
      );
    } catch (error) {
      console.error('Error getting user game data:', error);
      return {
        gamesRemaining: 3,
        isUnlimited: false,
        totalGamesPlayed: 0,
      };
    }
  },

  async canPlayGame(userId: string): Promise<boolean> {
    try {
      const userData = await this.getUserGameData(userId);
      if (!userData) {
        return false;
      }
      return userData.isUnlimited || userData.gamesRemaining > 0;
    } catch (error) {
      console.error('Error checking if user can play:', error);
      return false;
    }
  },

  async startGame(userId: string): Promise<boolean> {
    try {
      await apiService.post(`/users/${userId}/start-game`);
      return true;
    } catch (error) {
      console.error('Error starting game:', error);
      return false;
    }
  },

  async processPurchase(
    userId: string,
    productId: string,
    productName: string,
    gamesAdded: number,
    price: number,
    isUnlimited: boolean,
    transactionId?: string,
    platform?: string,
  ): Promise<boolean> {
    try {
      await apiService.post('/purchases/process', {
        userId,
        productId,
        productName,
        gamesAdded,
        price,
        isUnlimited,
        transactionId,
        platform,
      });
      return true;
    } catch (error) {
      console.error('Error processing purchase:', error);
      return false;
    }
  },

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    try {
      const response = await apiService.get<Purchase[]>(
        `/purchases/${userId}`,
      );
      return response || [];
    } catch (error) {
      console.error('Error getting user purchases:', error);
      return [];
    }
  },
};
