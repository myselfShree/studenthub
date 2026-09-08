'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '@/types';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem('studenthub_token');
    const savedUser = localStorage.getItem('studenthub_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (_) {
        localStorage.removeItem('studenthub_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data: AuthResponse = await api.login({ email, password });
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('studenthub_token', data.access_token);
    localStorage.setItem('studenthub_user', JSON.stringify(data.user));
    router.push('/dashboard');
  };

  const register = async (name: string, email: string, password: string) => {
    const data: AuthResponse = await api.register({ name, email, password });
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('studenthub_token', data.access_token);
    localStorage.setItem('studenthub_user', JSON.stringify(data.user));
    router.push('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('studenthub_token');
    localStorage.removeItem('studenthub_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
