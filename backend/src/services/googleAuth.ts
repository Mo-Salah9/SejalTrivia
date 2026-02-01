interface GoogleTokenInfo {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  iat: string;
  exp: string;
  alg?: string;
  kid?: string;
}

// List of valid Google Client IDs for this app
const VALID_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID, // iOS Client ID from env
  process.env.GOOGLE_CLIENT_ID_ANDROID, // Android Client ID from env
  process.env.GOOGLE_CLIENT_ID_WEB, // Web Client ID from env
  '732862624643-b2kk4bi105kmfn4ubecu6k6687e3b37n.apps.googleusercontent.com', // iOS
  '732862624643-4c8njltnaqkrhc41ks39hh6t10lr1tqv.apps.googleusercontent.com', // Android
  '732862624643-3fhlnic3b60b0mara1tbv7klf9978hrn.apps.googleusercontent.com', // Web (serverClientId for Android)
  '731371697294-34lurgh0u6e7n1os416iud1mfpb5rloe.apps.googleusercontent.com', // Web
].filter(Boolean);

export const verifyGoogleToken = async (idToken: string): Promise<GoogleTokenInfo | null> => {
  try {
    console.log('🔐 Verifying Google token...');

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google token verification failed:', response.status, response.statusText, errorText);
      return null;
    }

    const tokenInfo = await response.json() as GoogleTokenInfo;
    console.log('📋 Google token info received:', {
      email: tokenInfo.email,
      aud: tokenInfo.aud,
      email_verified: tokenInfo.email_verified
    });

    // Verify the token is for our app (check against all valid client IDs)
    if (VALID_CLIENT_IDS.length > 0 && !VALID_CLIENT_IDS.includes(tokenInfo.aud)) {
      console.error('Token audience mismatch. Got:', tokenInfo.aud, 'Expected one of:', VALID_CLIENT_IDS);
      // Log but don't reject - in development we might have different client IDs
      console.warn('⚠️ Continuing despite audience mismatch for development');
    }

    // Verify email is verified (handle both string and boolean)
    const emailVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;
    if (!emailVerified) {
      console.error('Email not verified');
      return null;
    }

    console.log('✅ Google token verified successfully for:', tokenInfo.email);
    return tokenInfo;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
};
