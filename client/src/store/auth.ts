import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Admin } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AuthState {
  user: User | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setAdmin: (admin: Admin | null) => void;
  logout: () => Promise<void>;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      admin: null,
      isAuthenticated: false,
      isAdmin: false,
      isHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user, admin: null, isAdmin: false }),
      setAdmin: (admin) => set({ admin, isAdmin: !!admin, user: null, isAuthenticated: false }),
      logout: async () => {
        try {
          await apiRequest('POST', '/api/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, admin: null, isAuthenticated: false, isAdmin: false });
        }
      },
      clearAuth: () => {
        set({ user: null, admin: null, isAuthenticated: false, isAdmin: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
