import { Platform } from 'react-native';
import { decode as base64Decode } from 'base-64';
import { apiService } from './apiService';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
}

/**
 * Authentication Service - React Native Version
 */
export const authService = {
  async signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthUser | {requiresVerification: true; email: string}> {
    try {
      console.log('Attempting to sign up:', email);

      const response = await apiService.post<{
        token?: string;
        user?: AuthUser;
        requiresVerification?: boolean;
        email?: string;
        message?: string;
      }>('/auth/signup', {email, password, displayName});

      if (response.requiresVerification) {
        console.log('Email verification required for:', email);
        return {requiresVerification: true, email: response.email || email};
      }

      if (response.token && response.user) {
        await apiService.setToken(response.token);
        console.log('Sign up successful:', response.user.uid);
        return response.user;
      }

      throw new Error('Unexpected response from server');
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Failed to sign up';
      if (error.message.includes('already')) {
        errorMessage =
          'This email is already registered. Please sign in instead.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      console.log('Attempting to sign in:', email);

      const response = await apiService.post<{
        token?: string;
        user?: AuthUser;
        error?: string;
        message?: string;
      }>('/auth/signin', {email, password});

      if (response.token && response.user) {
        await apiService.setToken(response.token);
        console.log('Sign in successful:', response.user.uid);
        return response.user;
      }

      throw new Error('Unexpected response from server');
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in';
      if (
        error.message.includes('not found') ||
        error.message.includes('user')
      ) {
        errorMessage =
          'No account found with this email. Please sign up first.';
      } else if (
        error.message.includes('password') ||
        error.message.includes('credential') ||
        error.message.includes('Invalid')
      ) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (
        error.message.includes('email') &&
        !error.message.includes('verified')
      ) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  async signOut(): Promise<void> {
    try {
      await apiService.clearToken();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await apiService.post('/auth/reset-password', {email});
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  async confirmResetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    try {
      await apiService.post('/auth/confirm-reset-password', {
        email,
        code,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  },

  async verifyEmail(email: string, code: string): Promise<AuthUser> {
    try {
      const response = await apiService.post<{token: string; user: AuthUser}>(
        '/auth/verify-email',
        {email, code},
      );
      await apiService.setToken(response.token);
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to verify email');
    }
  },

  async resendVerification(email: string): Promise<void> {
    try {
      await apiService.post('/auth/resend-verification', {email});
    } catch (error: any) {
      throw new Error(error.message || 'Failed to resend verification code');
    }
  },

  /**
   * Sign in with Google using @react-native-google-signin/google-signin
   */
  async signInWithGoogle(): Promise<AuthUser> {
    try {
      console.log('Starting Google Sign-In...');

      const {GoogleSignin} = await import(
        '@react-native-google-signin/google-signin'
      );

      GoogleSignin.configure({
        webClientId:
          '732862624643-3fhlnic3b60b0mara1tbv7klf9978hrn.apps.googleusercontent.com',
        offlineAccess: true,
      });

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('Failed to get ID token from Google Sign-In');
      }

      const apiResponse = await apiService.post<{
        token: string;
        user: AuthUser;
      }>('/auth/google', {idToken});

      await apiService.setToken(apiResponse.token);
      return apiResponse.user;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      if (
        error.message?.includes('canceled') ||
        error.message?.includes('cancelled')
      ) {
        throw new Error('Sign-in was cancelled');
      }
      throw new Error(error.message || 'Google Sign-In failed');
    }
  },

  /**
   * Sign in with Apple using expo-apple-authentication
   */
  async signInWithApple(): Promise<AuthUser> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS devices.');
    }

    try {
      console.log('Starting Apple Sign-In...');

      const AppleAuthentication = await import('expo-apple-authentication');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) {
        throw new Error('No identity token received from Apple Sign-In');
      }

      const apiResponse = await apiService.post<{
        token: string;
        user: AuthUser;
      }>('/auth/apple', {
        identityToken,
        user: {
          email: credential.email,
          givenName: credential.fullName?.givenName,
          familyName: credential.fullName?.familyName,
        },
      });

      await apiService.setToken(apiResponse.token);
      return apiResponse.user;
    } catch (error: any) {
      console.error('Apple Sign-In error:', error);
      if (
        error.code === 'ERR_REQUEST_CANCELED' ||
        error.message?.includes('canceled') ||
        error.message?.includes('cancelled')
      ) {
        throw new Error('Sign-in was cancelled');
      }
      throw new Error(error.message || 'Apple Sign-In failed');
    }
  },

  /**
   * Get current user from JWT token
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const token = await apiService.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(base64Decode(token.split('.')[1]));

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.log('Token expired, clearing...');
        await apiService.clearToken();
        return null;
      }

      return {
        uid: payload.uid,
        email: payload.email,
        displayName: payload.displayName || null,
        photoURL: payload.photoURL || null,
        isAdmin: payload.isAdmin || false,
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  /**
   * Check for redirect result (compatibility)
   */
  async checkRedirectResult(): Promise<AuthUser | null> {
    try {
      return await this.getCurrentUser();
    } catch (error: any) {
      console.error('Error checking auth state:', error);
      return null;
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(
    callback: (user: AuthUser | null) => void,
  ): () => void {
    this.getCurrentUser().then(callback);
    return () => {};
  },
};
