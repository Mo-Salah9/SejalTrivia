interface AppleReceiptResponse {
  status: number;
  receipt?: any;
  latest_receipt_info?: any[];
  environment?: string;
}

export const verifyAppleReceipt = async (
  receipt: string,
  productId: string,
  transactionId: string
): Promise<{ verified: boolean; error?: string }> => {
  const sharedSecret = process.env.APPLE_SHARED_SECRET;

  if (!sharedSecret) {
    console.warn('⚠️ APPLE_SHARED_SECRET not configured');
    return { verified: false, error: 'Apple shared secret not configured' };
  }

  try {
    // Try production first
    let url = 'https://buy.itunes.apple.com/verifyReceipt';
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        'password': sharedSecret,
        'exclude-old-transactions': true,
      }),
    });

    let result = (await response.json()) as AppleReceiptResponse;

    // If sandbox receipt (status 21007), retry with sandbox URL
    if (result.status === 21007) {
      console.log('📱 Sandbox receipt detected, retrying with sandbox URL');
      url = 'https://sandbox.itunes.apple.com/verifyReceipt';
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receipt,
          'password': sharedSecret,
          'exclude-old-transactions': true,
        }),
      });
      result = (await response.json()) as AppleReceiptResponse;
    }

    // Status 0 = success
    if (result.status === 0) {
      const inAppPurchases = result.receipt?.in_app || [];
      const purchase = inAppPurchases.find(
        (p: any) => p.transaction_id === transactionId
      );

      if (purchase && purchase.product_id === productId) {
        console.log('✅ Apple receipt verified successfully');
        return { verified: true };
      } else {
        return {
          verified: false,
          error: 'Transaction not found in receipt or product ID mismatch',
        };
      }
    }

    return {
      verified: false,
      error: `Apple verification failed with status: ${result.status}`,
    };
  } catch (error: any) {
    console.error('❌ Apple receipt verification error:', error);
    return {
      verified: false,
      error: error.message || 'Apple verification failed',
    };
  }
};
