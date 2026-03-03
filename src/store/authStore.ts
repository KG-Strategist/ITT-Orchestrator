import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CoERole = 
  | 'CoE_Super_Admin'
  | 'CoE_Fortress_Admin' 
  | 'CoE_CoreGuard_Admin' 
  | 'CoE_Agentic_GW_Admin' 
  | 'CoE_Unified_LLM_Admin';

export type Domain = 'Zone1' | 'Zone2' | 'Zone3' | 'Zone4' | 'LLM' | 'All';

interface User {
  id: string;
  username: string;
  name: string;
  role: CoERole;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasAccess: (domain: Domain) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      login: (user, token) => set({ isAuthenticated: true, user, token }),
      logout: () => set({ isAuthenticated: false, user: null, token: null }),
      hasAccess: (domain: Domain) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'CoE_Super_Admin') return true;
        
        switch (domain) {
          case 'Zone1': return user.role === 'CoE_Fortress_Admin';
          case 'Zone2': return user.role === 'CoE_CoreGuard_Admin';
          case 'Zone4': return user.role === 'CoE_Agentic_GW_Admin';
          case 'LLM': return user.role === 'CoE_Unified_LLM_Admin';
          case 'All': return false; // Only Super Admin has 'All'
          default: return false;
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
