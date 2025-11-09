'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hasValidAPICredentials } from '@/lib/utils/client-auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    try {
      const hasValidCreds = hasValidAPICredentials();
      setIsAuthenticated(hasValidCreds);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Clear any stored tokens or sessions
      // Since we're using environment variables, we can't actually clear them
      // But we can clear any browser storage and trigger a page reload

      // Clear localStorage if we store any auth data there
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userSession');
      }

      // Update auth state
      setIsAuthenticated(false);

      // Optionally redirect to login or home page
      // For now, we'll just reload the page to clear any cached state
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking if user is authenticated (with loading state)
export function useAuthStatus(): { isAuthenticated: boolean; isLoading: boolean } {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}