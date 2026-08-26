'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setApiToken } from '@/lib/api';

interface Session {
  backendToken: string;
  user: { id: string; email: string; name: string; role: string } | null;
  company: any | null;
}

interface SessionContextType {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, plan?: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const loadSession = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('recept_token');
    const userRaw = localStorage.getItem('recept_user');
    const companyRaw = localStorage.getItem('recept_company');

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    setApiToken(token);
    const user = userRaw ? JSON.parse(userRaw) : null;
    const company = companyRaw ? JSON.parse(companyRaw) : null;

    setSession({ backendToken: token, user, company });
    setStatus('authenticated');

    // Refresh from backend
    try {
      const data = await api.auth.me();
      const freshSession: Session = {
        backendToken: token,
        user: data.user,
        company: data.company,
      };
      setSession(freshSession);
      localStorage.setItem('recept_user', JSON.stringify(data.user));
      if (data.company) localStorage.setItem('recept_company', JSON.stringify(data.company));
    } catch {
      // Token expired or invalid
      localStorage.removeItem('recept_token');
      localStorage.removeItem('recept_user');
      localStorage.removeItem('recept_company');
      setSession(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('recept_token', data.token);
    localStorage.setItem('recept_user', JSON.stringify(data.user));
    if (data.company) localStorage.setItem('recept_company', JSON.stringify(data.company));
    setApiToken(data.token);
    setSession({ backendToken: data.token, user: data.user, company: data.company });
    setStatus('authenticated');
  };

  const register = async (name: string, email: string, password: string, plan?: string) => {
    const data = await api.auth.register({ name, email, password, plan });
    localStorage.setItem('recept_token', data.token);
    localStorage.setItem('recept_user', JSON.stringify(data.user));
    setApiToken(data.token);
    setSession({ backendToken: data.token, user: data.user, company: null });
    setStatus('authenticated');
  };

  const logout = () => {
    localStorage.removeItem('recept_token');
    localStorage.removeItem('recept_user');
    localStorage.removeItem('recept_company');
    setApiToken(null);
    setSession(null);
    setStatus('unauthenticated');
  };

  const refreshSession = async () => {
    await loadSession();
  };

  return (
    <SessionContext.Provider value={{ session, status, login, register, logout, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function useSessionCompat() {
  const { session, status } = useSession();
  return {
    data: session,
    status,
    update: async () => {},
  };
}
