interface AppleTokenInfo {
  sub: string; // Apple user ID
  email?: string;
  email_verified?: boolean;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  iat?: number;
  exp?: number;
}

/**
 * Verify Apple ID token
 * For production, you should verify the token signature using Apple's public keys
 * For now, we'll decode and validate the basic structure
 */
export const verifyAppleToken = async (idToken: string): Promise<AppleTokenInfo | null> => {
  try {
    // Decode the JWT token (without verification for now)
    // In production, verify signature using Apple's public keys
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid Apple ID token format');
      return null;
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8')) as AppleTokenInfo;

    // Basic validation
    if (!payload.sub) {
      console.error('Apple token missing user ID (sub)');
      return null;
    }

    // Check expiration if present
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.error('Apple token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Error verifying Apple token:', error);
    return null;
  }
};
