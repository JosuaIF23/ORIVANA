import { create } from 'zustand';
import type { AuthUser } from '@/types/auth_user';
import type { AccessibleClient } from '@/types/accessible_client';

interface UserStore {
  user: AuthUser | null;
  token: string | null;
  clients: AccessibleClient[];
  activeClientId: number | null;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setClients: (clients: AccessibleClient[]) => void;
  setActiveClientId: (clientId: number | null) => void;
  clearUser: () => void;
}

function parseStoredNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export const useUserStore = create<UserStore>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  clients: localStorage.getItem('clients') ? JSON.parse(localStorage.getItem('clients')!) : [],
  activeClientId: parseStoredNumber(localStorage.getItem('active_client_id')),
  setUser: (user) => {
    if(user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setClients: (clients) => {
    localStorage.setItem('clients', JSON.stringify(clients));
    set({ clients });
  },
  setActiveClientId: (clientId) => {
    if (clientId) {
      localStorage.setItem('active_client_id', String(clientId));
    } else {
      localStorage.removeItem('active_client_id');
    }
    set({ activeClientId: clientId });
  },
  clearUser: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('clients');
    localStorage.removeItem('active_client_id');
    set({ user: null, token: null, clients: [], activeClientId: null });
  },
}));

