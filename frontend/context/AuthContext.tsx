'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '@/types';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string, phone_number?: string) => Promise<any>;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
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
        setUserState(JSON.parse(savedUser));
      } catch (_) {
        localStorage.removeItem('studenthub_user');
      }
    }
    setLoading(false);
  }, []);

  const setSession = (accessToken: string, userObj: User) => {
    setToken(accessToken);
    setUserState(userObj);
    localStorage.setItem('studenthub_token', accessToken);
    localStorage.setItem('studenthub_user', JSON.stringify(userObj));
    router.push('/dashboard');
  };

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    if (data.mfa_required) {
      return data;
    }
    if (data.access_token && data.user) {
      setSession(data.access_token, data.user);
    }
    return data;
  };

  const register = async (name: string, email: string, password: string, phone_number?: string) => {
    const data = await api.register({ name, email, password, phone_number });
    return data;
  };

  const logout = () => {
    setToken(null);
    setUserState(null);
    localStorage.removeItem('studenthub_token');
    localStorage.removeItem('studenthub_user');
    router.push('/login');
  };

  const setUser = (u: User) => {
    setUserState(u);
    localStorage.setItem('studenthub_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, setSession, logout, setUser }}>
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
