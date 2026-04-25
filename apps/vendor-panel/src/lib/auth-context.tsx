'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth as authApi, vendor as vendorApi, type VendorUser, type VendorProfile } from './api';

interface AuthContextType {
  user: VendorUser | null;
  profile: VendorProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phoneNumber: string,
    businessName: string,
    description: string,
    address: { addressLine1: string; district: string; state: string; pincode: string }
  ) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VendorUser | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await vendorApi.getProfile();
      setProfile(p);
    } catch {
      // profile may not exist yet
    }
  }, []);

  useEffect(() => {
    const token = authApi.getToken();
    const storedUser = localStorage.getItem('vendor_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        loadProfile();
      } catch {
        authApi.clearTokens();
        localStorage.removeItem('vendor_user');
      }
    }
    setIsLoading(false);
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    authApi.setTokens(result.accessToken, result.refreshToken);
    localStorage.setItem('vendor_user', JSON.stringify(result.user));
    setUser(result.user);
    await loadProfile();
  }, [loadProfile]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    phoneNumber: string,
    businessName: string,
    description: string,
    address: { addressLine1: string; district: string; state: string; pincode: string }
  ) => {
    const result = await authApi.register(name, email, password, phoneNumber);
    authApi.setTokens(result.accessToken, result.refreshToken);
    localStorage.setItem('vendor_user', JSON.stringify(result.user));
    setUser(result.user);

    const vendorProfile = await vendorApi.register({
      businessName,
      description: description || undefined,
      phoneNumber,
      email,
      address,
    });
    setProfile(vendorProfile);
  }, []);

  const logout = useCallback(() => {
    authApi.clearTokens();
    localStorage.removeItem('vendor_user');
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, isAuthenticated: !!user, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
