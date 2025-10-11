import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Admin } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AuthState {
  user: User | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setAdmin: (admin: Admin | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      admin: null,
      isAuthenticated: false,
      isAdmin: false,
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
    }),
    {
      name: 'auth-storage',
    }
  )
);
