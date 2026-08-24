import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  uuid: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'HOST' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  profileImage?: string;
  hasProfile?: boolean;
  provider?: string;
  googleId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: (redirectTo?: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const response = await api.get('/auth/me');
        const freshUser = response.data.data.user;
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        setToken(storedToken);
      } catch (err: any) {
        // Only clear auth if explicitly unauthorized (401)
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        } else {
          console.warn('Session verification encountered temporary error, keeping cached session:', err);
        }
      }
    } else {
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback((newToken: string, newUser: User, refreshToken?: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback((redirectTo: string = '/') => {
    // 1. Immediately clear frontend auth credentials for instant UI update
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    // 2. Fire backend logout in the background without blocking the UI
    api.post('/auth/logout').catch((err) => {
      console.error('Background backend logout failed:', err);
    });

    // 3. Redirect to home page or specified route
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    refreshUser: fetchUser
  }), [user, token, loading, login, logout, fetchUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
