import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';
import type { Employee, Tokens } from '@/lib/api';

interface AuthContextType {
  user: Employee | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and tokens from localStorage on mount
  useEffect(() => {
    const loadAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedTokens = localStorage.getItem('tokens');

        if (storedUser && storedTokens) {
          setUser(JSON.parse(storedUser));
          setTokens(JSON.parse(storedTokens));
        }
      } catch (error) {
        console.error('Error loading auth from localStorage:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    
    setUser(response.data.employee);
    setTokens(response.data.tokens);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(response.data.employee));
    localStorage.setItem('tokens', JSON.stringify(response.data.tokens));
    localStorage.setItem('access_token', response.data.tokens.access);
    localStorage.setItem('refresh_token', response.data.tokens.refresh);
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
