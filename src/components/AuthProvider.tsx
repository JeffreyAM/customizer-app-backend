'use client';

import { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: { email: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('adminUser');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    if (email === 'admin' && password === 'admin123!') {
      const adminUser = { email: 'admin@dashboard.local' };
      setUser(adminUser);
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      return { data: { user: adminUser }, error: null };
    } else {
      return { data: null, error: { message: 'Invalid credentials' } };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('adminUser');
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}