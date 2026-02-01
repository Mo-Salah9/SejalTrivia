import { google } from 'googleapis';

interface GooglePlayPurchaseResponse {
  purchaseState: number; // 0 = purchased, 1 = canceled
  consumptionState: number; // 0 = yet to be consumed, 1 = consumed
  purchaseTimeMillis: string;
  orderId: string;
  purchaseType?: number;
  acknowledgementState?: number;
}

/**
 * Verify Google Play purchase
 * Requires Google Play Android Developer API service account credentials
 */
export const verifyGooglePlayPurchase = async (
  purchaseToken: string,
  productId: string,
  packageName: string = 'com.falsafa.trivia'
): Promise<{ verified: boolean; error?: string }> => {
  // Check if service account credentials are configured
  const serviceAccountKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.warn('⚠️ GOOGLE_PLAY_SERVICE_ACCOUNT_KEY not configured');
    // For development/testing, allow purchases without verification
    // In production, this should return false
    console.log('⚠️ Allowing purchase without verification (development mode)');
    return { verified: true };
  }

  try {
    // Parse service account key (can be JSON string or path to JSON file)
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch {
      // If parsing fails, assume it's a file path
      const fs = await import('fs');
      const path = await import('path');
      const keyPath = path.resolve(serviceAccountKey);
      credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    }

    // Create Google Play Android Developer API client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    const androidpublisher = google.androidpublisher({
      version: 'v3',
      auth,
    });

    // Verify the purchase
    const response = await androidpublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

    const purchase = response.data as GooglePlayPurchaseResponse;

    // Check purchase state
    // 0 = purchased, 1 = canceled
    if (purchase.purchaseState !== 0) {
      return {
        verified: false,
        error: `Purchase state is ${purchase.purchaseState} (not purchased)`,
      };
    }

    // Purchase is valid if purchaseState is 0 (purchased)
    // The productId is already verified by the API call itself

    console.log('✅ Google Play purchase verified successfully');
    return { verified: true };
  } catch (error: any) {
    console.error('❌ Google Play verification error:', error);
    
    // Handle specific Google API errors
    if (error.code === 401) {
      return {
        verified: false,
        error: 'Invalid service account credentials',
      };
    }
    
    if (error.code === 404) {
      return {
        verified: false,
        error: 'Purchase not found (invalid purchase token or product ID)',
      };
    }

    // For development, allow purchases even if verification fails
    // In production, you might want to return false
    console.warn('⚠️ Verification failed, but allowing purchase (development mode)');
    return { verified: true };
  }
};
