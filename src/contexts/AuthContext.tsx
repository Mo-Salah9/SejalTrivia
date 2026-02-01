import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {authService, AuthUser} from '../services/authService';
import {adminService} from '../services/backendService';
import {storage} from '../utils/storage';

export interface VerificationRequired {
  requiresVerification: true;
  email: string;
}

export const isVerificationRequired = (result: any): result is VerificationRequired => {
  return result && result.requiresVerification === true;
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthUser | VerificationRequired>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          try {
            const adminStatus = await adminService.isAdmin(currentUser.uid);
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthUser | VerificationRequired> => {
    const result = await authService.signUp(email, password, displayName);
    if (isVerificationRequired(result)) {
      setPendingVerificationEmail(result.email);
      return result;
    }
    setUser(result);
    return result;
  };

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    const result = await authService.signIn(email, password);
    setUser(result);
    try {
      const adminStatus = await adminService.isAdmin(result.uid);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
    return result;
  };

  const signInWithGoogle = async () => {
    const authUser = await authService.signInWithGoogle();
    setUser(authUser);
    try {
      const adminStatus = await adminService.isAdmin(authUser.uid);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signInWithApple = async () => {
    const authUser = await authService.signInWithApple();
    setUser(authUser);
    try {
      const adminStatus = await adminService.isAdmin(authUser.uid);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setIsAdmin(false);
    setPendingVerificationEmail(null);
    await storage.removeItem('trivia_game_state_v2');
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const confirmResetPassword = async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    await authService.confirmResetPassword(email, code, newPassword);
  };

  const verifyEmailFn = async (email: string, code: string) => {
    const authUser = await authService.verifyEmail(email, code);
    setUser(authUser);
    setPendingVerificationEmail(null);
    try {
      const adminStatus = await adminService.isAdmin(authUser.uid);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const resendVerification = async (email: string) => {
    await authService.resendVerification(email);
  };

  const refreshAdminStatus = async () => {
    if (user) {
      try {
        const adminStatus = await adminService.isAdmin(user.uid);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error refreshing admin status:', error);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    pendingVerificationEmail,
    setPendingVerificationEmail,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    confirmResetPassword,
    verifyEmail: verifyEmailFn,
    resendVerification,
    refreshAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
