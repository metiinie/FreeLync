import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User, LoginFormData, RegisterFormData, ProfileFormData } from '../types';
import { AuthService } from '../services/auth';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (data: RegisterFormData) => Promise<void>;
  signIn: (data: LoginFormData) => Promise<void>;
  login: (data: LoginFormData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<ProfileFormData>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signUp = async (data: RegisterFormData) => {
    try {
      setLoading(true);

      const result = await AuthService.signUp(data);

      if (result.success) {
        toast.success(result.message || 'Registration successful!');
        if (result.user) {
          setUser(result.user);
        }
      } else {
        const errorMessage = result.message || 'Registration failed. Please try again.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please check your information and try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: LoginFormData) => {
    try {
      setLoading(true);

      const result = await AuthService.signIn(data);

      if (result.success) {
        toast.success(result.message || 'Login successful!');
        if (result.user) {
          setUser(result.user);
        }
      } else {
        const errorMessage = result.message || 'Login failed. Please check your credentials and try again.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please check your email and password and try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = signIn;

  const signOut = async () => {
    try {
      const result = await AuthService.signOut();

      if (result.success) {
        setUser(null);
        toast.success(result.message || 'Logged out successfully');
      } else {
        toast.error(result.message || 'Logout failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
    }
  };

  const updateProfile = async (data: Partial<ProfileFormData>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const result = await AuthService.updateProfile(user.id, data);

      if (result.success) {
        if (result.user) {
          setUser(result.user);
        }
        toast.success(result.message || 'Profile updated successfully');
      } else {
        toast.error(result.message || 'Profile update failed');
        throw new Error(result.message || 'Profile update failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Profile update failed');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await AuthService.resetPassword(email);

      if (result.success) {
        toast.success(result.message || 'Password reset email sent');
      } else {
        toast.error(result.message || 'Password reset failed');
        throw new Error(result.message || 'Password reset failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Password reset failed');
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const result = await AuthService.verifyEmail(token);

      if (result.success) {
        toast.success(result.message || 'Email verified successfully');
      } else {
        toast.error(result.message || 'Email verification failed');
        throw new Error(result.message || 'Email verification failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Email verification failed');
      throw error;
    }
  };

  const resendVerification = async () => {
    // TODO: Implement backend endpoint for this
    toast.info('Feature not yet implemented in backend');
  };

  const refreshUser = async () => {
    if (user) {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) setUser(currentUser);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    login,
    signOut,
    updateProfile,
    resetPassword,
    verifyEmail,
    resendVerification,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
