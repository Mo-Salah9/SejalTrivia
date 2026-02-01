import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import { generateToken } from '../services/tokenService';
import { verifyGoogleToken } from '../services/googleAuth';
import { verifyAppleToken } from '../services/appleAuth';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/emailService';

// Token expiration time (15 minutes)
const TOKEN_EXPIRATION_MS = 15 * 60 * 1000;

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists with this email' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user (email verification disabled for now)
    const user = await User.create({
      uid: uuidv4(),
      email,
      passwordHash,
      displayName: displayName || null,
      photoURL: null,
      provider: 'email',
      isAdmin: false,
      gamesRemaining: parseInt(process.env.INITIAL_FREE_GAMES || '3'),
      isUnlimited: false,
      totalGamesPlayed: 0,
      emailVerified: true, // Auto-verify for now (no email verification required)
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    });

    // Generate JWT token immediately (no verification needed)
    const token = generateToken({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      isAdmin: user.isAdmin,
    });

    console.log(`✅ Account created for ${email} (email verification disabled)`);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
};

// Verify email with code
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required' });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already verified
    if (user.emailVerified) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    // Check verification code
    if (user.emailVerificationToken !== code) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    // Check if code expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
      return;
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Generate JWT
    const token = generateToken({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      isAdmin: user.isAdmin,
    });

    console.log(`✅ Email verified for ${email}`);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

// Resend verification code
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      res.json({ message: 'If the email exists, a verification code has been sent' });
      return;
    }

    // Check if already verified
    if (user.emailVerified) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    user.emailVerificationToken = verificationCode;
    user.emailVerificationExpires = new Date(Date.now() + TOKEN_EXPIRATION_MS);
    await user.save();

    // Send verification email in background
    sendVerificationEmail(email, verificationCode, user.displayName || undefined)
      .then(() => console.log(`📧 Verification code resent to ${email}`))
      .catch(err => console.error('Failed to resend verification email:', err));

    res.json({ message: 'Verification code sent to your email' });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Note: Email verification is only required during sign up, not sign in
    // If user has correct password, they can sign in regardless of verification status

    // Generate JWT
    const token = generateToken({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      isAdmin: user.isAdmin,
    });

    res.json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Signin failed' });
  }
};

export const googleSignin = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔐 Google Sign-In request received');
    const { idToken } = req.body;

    if (!idToken) {
      console.error('❌ No idToken in request body. Keys:', Object.keys(req.body));
      res.status(400).json({ error: 'ID token is required' });
      return;
    }

    console.log('🔑 Token received, length:', idToken.length);

    // Verify Google ID token
    const tokenInfo = await verifyGoogleToken(idToken);
    if (!tokenInfo) {
      console.error('❌ Token verification failed');
      res.status(401).json({ error: 'Invalid Google ID token' });
      return;
    }

    console.log('✅ Token verified for:', tokenInfo.email);

    // Find or create user
    let user = await User.findOne({ email: tokenInfo.email });

    if (!user) {
      // Create new user (Google users are auto-verified)
      user = await User.create({
        uid: uuidv4(),
        email: tokenInfo.email,
        displayName: tokenInfo.name || null,
        photoURL: tokenInfo.picture || null,
        provider: 'google',
        googleId: tokenInfo.sub,
        isAdmin: false,
        gamesRemaining: parseInt(process.env.INITIAL_FREE_GAMES || '3'),
        isUnlimited: false,
        totalGamesPlayed: 0,
        emailVerified: true, // Google users are verified
      });
    } else {
      // Update existing user info
      user.displayName = tokenInfo.name || user.displayName;
      user.photoURL = tokenInfo.picture || user.photoURL;
      user.googleId = tokenInfo.sub;
      user.emailVerified = true; // Mark as verified
      await user.save();
    }

    // Generate JWT
    const token = generateToken({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      isAdmin: user.isAdmin,
    });

    res.json({
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('Google signin error:', error);
    res.status(500).json({ error: 'Google signin failed' });
  }
};

export const appleSignin = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🍎 Apple Sign-In request received');
    console.log('📦 Request body keys:', Object.keys(req.body));

    // Accept both formats: { idToken } or { identityToken, user }
    const { idToken, identityToken, email, displayName, user: userInfo } = req.body;
    const appleIdToken = identityToken || idToken;

    console.log('🔑 Token found:', appleIdToken ? `yes (${appleIdToken.length} chars)` : 'NO');
    console.log('👤 User info:', userInfo ? JSON.stringify(userInfo) : 'none');

    if (!appleIdToken) {
      console.error('❌ No token found. identityToken:', !!identityToken, 'idToken:', !!idToken);
      res.status(400).json({ error: 'ID token is required' });
      return;
    }

    // Get user info from either format
    const userEmail = email || userInfo?.email;
    const userName = displayName || (userInfo ? `${userInfo.givenName || ''} ${userInfo.familyName || ''}`.trim() : null);

    // Verify Apple ID token
    const tokenInfo = await verifyAppleToken(appleIdToken);
    if (!tokenInfo) {
      res.status(401).json({ error: 'Invalid Apple ID token' });
      return;
    }

    // Apple may not always provide email in subsequent sign-ins
    // Use email from token if available, otherwise from request body
    const finalEmail = tokenInfo.email || userEmail;
    if (!finalEmail) {
      res.status(400).json({ error: 'Email is required for Apple sign-in' });
      return;
    }

    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: finalEmail },
        { appleId: tokenInfo.sub }
      ]
    });

    if (!user) {
      // Create new user (Apple users are auto-verified)
      const fullName = userName ||
        (tokenInfo.name ? `${tokenInfo.name.firstName || ''} ${tokenInfo.name.lastName || ''}`.trim() : null);

      user = await User.create({
        uid: uuidv4(),
        email: finalEmail,
        displayName: fullName || null,
        photoURL: null, // Apple doesn't provide photo URL
        provider: 'apple',
        appleId: tokenInfo.sub,
        isAdmin: false,
        gamesRemaining: parseInt(process.env.INITIAL_FREE_GAMES || '3'),
        isUnlimited: false,
        totalGamesPlayed: 0,
        emailVerified: true, // Apple users are verified
      });
    } else {
      // Update existing user info
      if (!user.appleId) {
        user.appleId = tokenInfo.sub;
      }
      if (userName && !user.displayName) {
        user.displayName = userName;
      }
      if (finalEmail && !user.email) {
        user.email = finalEmail;
      }
      user.emailVerified = true; // Mark as verified
      await user.save();
    }

    // Generate JWT
    const jwtToken = generateToken({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      isAdmin: user.isAdmin,
    });

    console.log('✅ Apple Sign-In successful for:', user.email);

    res.json({
      token: jwtToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('Apple signin error:', error);
    res.status(500).json({ error: 'Apple signin failed' });
  }
};

// Request password reset
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Find user
    const user = await User.findOne({ email, provider: 'email' });
    if (!user) {
      res.status(404).json({ error: 'No account found with this email. Please sign up first.' });
      return;
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    user.passwordResetToken = resetCode;
    user.passwordResetExpires = new Date(Date.now() + TOKEN_EXPIRATION_MS);
    await user.save();

    // Send password reset email in background
    sendPasswordResetEmail(email, resetCode, user.displayName || undefined)
      .then(() => console.log(`📧 Password reset code sent to ${email}`))
      .catch(err => console.error('Failed to send password reset email:', err));

    res.json({ message: 'Password reset code sent to your email' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

// Verify reset code and set new password
export const confirmResetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, code, and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Find user
    const user = await User.findOne({ email, provider: 'email' });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check reset code
    if (user.passwordResetToken !== code) {
      res.status(400).json({ error: 'Invalid reset code' });
      return;
    }

    // Check if code expired
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      res.status(400).json({ error: 'Reset code expired. Please request a new one.' });
      return;
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log(`✅ Password reset successful for ${email}`);

    res.json({ message: 'Password reset successful. You can now sign in with your new password.' });
  } catch (error: any) {
    console.error('Confirm reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
