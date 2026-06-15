import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConfirmationResult } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

const SecureStoreStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  photoUrl: string | null;
  setPhotoUrl: (url: string | null) => void;
  displayName: string | null;
  setDisplayName: (name: string | null) => void;
  logout: () => void;
  confirmationResult: ConfirmationResult | null;
  setConfirmationResult: (result: ConfirmationResult | null) => void;
  pendingCredentials: { username?: string, password?: string } | null;
  setPendingCredentials: (creds: { username?: string, password?: string } | null) => void;
  // PIN
  pin: string | null;
  hasPin: boolean;
  setPin: (pin: string) => void;
  clearPin: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      photoUrl: null,
      displayName: null,
      confirmationResult: null,
      pendingCredentials: null,
      pin: null,
      hasPin: false,
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setPhotoUrl: (url) => set({ photoUrl: url }),
      setDisplayName: (name) => set({ displayName: name }),
      logout: () => set({ token: null, isAuthenticated: false, photoUrl: null, displayName: null, confirmationResult: null, pendingCredentials: null, pin: null, hasPin: false }),
      setConfirmationResult: (result) => set({ confirmationResult: result }),
      setPendingCredentials: (creds) => set({ pendingCredentials: creds }),
      setPin: (pin) => set({ pin, hasPin: true }),
      clearPin: () => set({ pin: null, hasPin: false }),
    }),
    {
      name: 'njangi-auth-secure-storage',
      storage: createJSONStorage(() => SecureStoreStorage),
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated, photoUrl: state.photoUrl, displayName: state.displayName, pin: state.pin, hasPin: state.hasPin }),
    }
  )
);
