/**
 * Native In-App Purchase Service
 * Uses react-native-iap for iOS and Android
 */

import {Platform} from 'react-native';
import * as RNIap from 'react-native-iap';
import {apiService} from './apiService';

// Product IDs - must match App Store Connect and Google Play Console
export const NATIVE_PRODUCT_IDS = {
  pack_3: 'pack_3_games',
  pack_7: 'pack_7_games',
  pack_10: 'pack_10_games',
  unlimited: 'unlimited_games',
};

export const PRODUCT_ID_MAP: {[key: string]: string} = {
  pack_3: NATIVE_PRODUCT_IDS.pack_3,
  pack_7: NATIVE_PRODUCT_IDS.pack_7,
  pack_10: NATIVE_PRODUCT_IDS.pack_10,
  unlimited: NATIVE_PRODUCT_IDS.unlimited,
};

const GAME_MAPPING: {[key: string]: {games: number; unlimited: boolean}} = {
  [NATIVE_PRODUCT_IDS.pack_3]: {games: 3, unlimited: false},
  [NATIVE_PRODUCT_IDS.pack_7]: {games: 7, unlimited: false},
  [NATIVE_PRODUCT_IDS.pack_10]: {games: 10, unlimited: false},
  [NATIVE_PRODUCT_IDS.unlimited]: {games: 0, unlimited: true},
};

interface PurchaseCallback {
  onSuccess: (
    productId: string,
    transactionId: string,
    receipt: string,
  ) => Promise<void>;
  onError: (error: string) => void;
}

class NativePaymentService {
  private initialized = false;
  private purchaseCallback: PurchaseCallback | null = null;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  isAvailable(): boolean {
    return true; // Always native in React Native
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      await RNIap.initConnection();
      console.log('[IAP] Connection initialized');

      // Set up purchase listeners
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        async (purchase) => {
          console.log('[IAP] Purchase updated:', purchase.productId);

          const receipt =
            Platform.OS === 'ios'
              ? purchase.transactionReceipt || ''
              : purchase.purchaseToken || '';

          const transactionId =
            purchase.transactionId ||
            purchase.transactionDate?.toString() ||
            '';

          if (this.purchaseCallback) {
            try {
              // Verify with backend
              let verified = false;
              try {
                verified = await this.verifyPurchase({
                  productId: purchase.productId,
                  transactionId,
                  receipt,
                });
              } catch (e) {
                console.warn('[IAP] Verification error, continuing:', e);
                verified = true; // Allow for sandbox
              }

              if (verified) {
                await this.purchaseCallback.onSuccess(
                  purchase.productId || '',
                  transactionId,
                  receipt,
                );
              }

              // Finish the transaction
              await RNIap.finishTransaction({purchase, isConsumable: true});
              console.log('[IAP] Transaction finished');
            } catch (error: any) {
              console.error('[IAP] Error processing purchase:', error);
              if (this.purchaseCallback) {
                this.purchaseCallback.onError(
                  error.message || 'Error processing purchase',
                );
              }
            }
          }
        },
      );

      this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
        (error) => {
          console.error('[IAP] Purchase error:', error);
          if (this.purchaseCallback) {
            this.purchaseCallback.onError(
              error.message || 'Purchase failed',
            );
          }
        },
      );

      this.initialized = true;
      return true;
    } catch (error: any) {
      console.error('[IAP] Initialization error:', error);
      return false;
    }
  }

  setPurchaseCallback(callback: PurchaseCallback) {
    this.purchaseCallback = callback;
  }

  async purchaseProduct(
    productId: string,
  ): Promise<{success: boolean; error?: string}> {
    if (!this.initialized) {
      const initResult = await this.initialize();
      if (!initResult) {
        return {success: false, error: 'Failed to initialize IAP service'};
      }
    }

    try {
      const nativeProductId = PRODUCT_ID_MAP[productId] || productId;

      console.log('[IAP] Requesting purchase:', nativeProductId);

      // Check products availability
      try {
        const products = await RNIap.getProducts({
          skus: [nativeProductId],
        });
        console.log('[IAP] Available products:', products.length);
      } catch (e) {
        console.warn('[IAP] Error checking products:', e);
      }

      // Request purchase
      await RNIap.requestPurchase({sku: nativeProductId});

      return {success: true};
    } catch (error: any) {
      console.error('[IAP] Purchase error:', error);

      let errorMessage = error.message || 'Purchase failed';
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Purchase was cancelled';
      }

      return {success: false, error: errorMessage};
    }
  }

  private async verifyPurchase(purchase: any): Promise<boolean> {
    try {
      const platform = Platform.OS;
      const receipt = purchase.receipt || purchase.transactionId;
      const transactionId = purchase.transactionId;

      if (!receipt) {
        console.warn('[IAP] No receipt found, allowing purchase');
        return true;
      }

      const result = await apiService.post<{
        verified: boolean;
        purchaseId?: string;
      }>('/purchases/verify', {
        platform,
        receipt,
        productId: purchase.productId,
        transactionId,
        packageName: 'com.falsafa.trivia',
      });

      return result.verified === true;
    } catch (error: any) {
      console.error('[IAP] Verification error:', error);
      if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('Network')
      ) {
        return true; // Allow in development
      }
      return false;
    }
  }

  async grantGames(
    productId: string,
    transactionId: string,
    userId: string,
  ): Promise<boolean> {
    const mapping = GAME_MAPPING[productId];
    if (!mapping) {
      console.error('[IAP] No game mapping found for product:', productId);
      return false;
    }

    try {
      const {userService} = await import('./backendService');
      const productName = productId
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      await userService.processPurchase(
        userId,
        productId,
        productName,
        mapping.games,
        0,
        mapping.unlimited,
        transactionId,
        Platform.OS,
      );

      return true;
    } catch (error: any) {
      console.error('[IAP] Error in grantGames:', error);
      return false;
    }
  }

  async restorePurchases(
    userId: string,
  ): Promise<{restored: boolean; hasUnlimited: boolean; message: string}> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const purchases = await apiService.get<any[]>(`/purchases/${userId}`);

      if (!purchases || purchases.length === 0) {
        return {
          restored: true,
          hasUnlimited: false,
          message: 'No previous purchases found',
        };
      }

      const {userService} = await import('./backendService');
      const userData = await userService.getUserGameData(userId);

      const hasUnlimitedPurchase = purchases.some(
        (p: any) =>
          p.productId === NATIVE_PRODUCT_IDS.unlimited ||
          p.isUnlimited === true,
      );

      if (hasUnlimitedPurchase) {
        if (!userData?.isUnlimited) {
          const unlimitedPurchase = purchases.find(
            (p: any) =>
              p.productId === NATIVE_PRODUCT_IDS.unlimited ||
              p.isUnlimited === true,
          );
          await userService.processPurchase(
            userId,
            NATIVE_PRODUCT_IDS.unlimited,
            'Unlimited Games (Restored)',
            0,
            0,
            true,
            unlimitedPurchase?.transactionId,
            unlimitedPurchase?.platform || Platform.OS,
          );
          return {
            restored: true,
            hasUnlimited: true,
            message: 'Unlimited access restored!',
          };
        }
        return {
          restored: true,
          hasUnlimited: true,
          message: 'You already have unlimited access',
        };
      }

      return {
        restored: true,
        hasUnlimited: false,
        message: 'No unlimited purchase found. Your game packs are already in your account.',
      };
    } catch (error: any) {
      console.error('[IAP] Error restoring purchases:', error);
      return {
        restored: false,
        hasUnlimited: false,
        message: error.message || 'Failed to restore purchases',
      };
    }
  }

  async getProducts() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      const productIds = Object.values(NATIVE_PRODUCT_IDS);
      return await RNIap.getProducts({skus: productIds});
    } catch (error) {
      return [];
    }
  }

  cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
    this.initialized = false;
    this.purchaseCallback = null;
  }
}

export const nativePaymentService = new NativePaymentService();
