'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hasValidAPICredentials } from '@/lib/utils/client-auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  checkAuth: () => void;
}

// CRITICAL: Lazy initialization to prevent createContext during static generation
// Do NOT call createContext at module load time - only when actually needed
let AuthContext: React.Context<AuthContextType | undefined> | null = null;
function getAuthContext() {
  if (!AuthContext) {
    AuthContext = createContext<AuthContextType | undefined>(undefined);
  }
  return AuthContext;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined') {
    // Return children directly during static generation to prevent build failures
    return <>{children}</>;
  }

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

  const Context = getAuthContext();
  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}

export function useAuth(): AuthContextType {
  // During static generation, React can be null, so check before using any hooks
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      isLoading: false,
      logout: () => {},
      checkAuth: () => {}
    } as AuthContextType;
  }

  // Check if React context system is available (React can be null during static generation)
  try {
    const Context = getAuthContext();
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  } catch (error) {
    // During static generation or when React context isn't available,
    // return a fallback object to prevent runtime errors
    if (typeof window === 'undefined') {
      return {
        isAuthenticated: false,
        isLoading: false,
        logout: () => {},
        checkAuth: () => {}
      } as AuthContextType;
    }
    // Re-throw the error if we're in a browser environment
    throw error;
  }
}

// Hook for checking if user is authenticated (with loading state)
export function useAuthStatus(): { isAuthenticated: boolean; isLoading: boolean } {
  // During static generation, React can be null, so check before using any hooks
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, isLoading: false };
  }

  try {
    const { isAuthenticated, isLoading } = useAuth();
    return { isAuthenticated, isLoading };
  } catch (error) {
    // During static generation or when React context isn't available,
    // return safe defaults
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, isLoading: false };
    }
    // Re-throw the error if we're in a browser environment
    throw error;
  }
}