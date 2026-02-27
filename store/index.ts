import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { User, TenantDetailed, ToastMessage, UserRole, WaitingRoomFilter } from '../types';
import {
  CURRENT_USER_DOCTOR,
  CURRENT_USER_ASSISTANT,
  CURRENT_USER_ADMIN,
  CURRENT_USER_CLINIC_ADMIN,
  MOCK_TENANTS_DETAILED,
} from '../constants';

interface MedicomStore {
  // ── Auth State ──
  currentUser: User | null;
  currentTenant: TenantDetailed | null;
  isAuthLoading: boolean;

  // ── UI State ──
  toasts: ToastMessage[];
  isSidebarCollapsed: boolean;
  waitingRoomFilter: WaitingRoomFilter;

  // ── Auth Actions ──
  setCurrentUser: (user: User | null) => void;
  setCurrentTenant: (tenant: TenantDetailed | null) => void;
  setAuthLoading: (v: boolean) => void;

  /**
   * Dev-only action: initialize auth from a mock role.
   * Maps role → mock user + tenant.
   * Will be removed in Phase 14 when real Supabase auth replaces it.
   */
  initializeFromMock: (role: UserRole) => void;

  // ── UI Actions ──
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSidebar: () => void;
  setWaitingRoomFilter: (filter: WaitingRoomFilter) => void;
  setDoctorPreferences: (prefs: Partial<import('../types').DoctorPreferences>) => void;
}

/**
 * Global Zustand store for Medicom.
 * Uses immer middleware for safe nested state updates.
 */
export const useMedicomStore = create<MedicomStore>()(
  immer((set) => ({
    // ── Initial State ──
    currentUser: null,
    currentTenant: null,
    isAuthLoading: true,
    toasts: [],
    isSidebarCollapsed: false,
    waitingRoomFilter: 'all',

    // ── Auth Actions ──
    setCurrentUser: (user) =>
      set((state) => {
        state.currentUser = user;
      }),

    setCurrentTenant: (tenant) =>
      set((state) => {
        state.currentTenant = tenant;
      }),

    setAuthLoading: (v) =>
      set((state) => {
        state.isAuthLoading = v;
      }),

    initializeFromMock: (role) =>
      set((state) => {
        const mockUserMap: Record<UserRole, User> = {
          doctor: CURRENT_USER_DOCTOR,
          staff: CURRENT_USER_ASSISTANT,
          clinic_admin: CURRENT_USER_CLINIC_ADMIN,
          super_admin: CURRENT_USER_ADMIN,
          patient: { id: 'p-user', name: 'Patient Demo', role: 'patient', avatar: '' },
        };

        state.currentUser = mockUserMap[role] || CURRENT_USER_DOCTOR;
        state.isAuthLoading = false;

        // Set tenant for clinic roles
        if (role !== 'super_admin' && role !== 'patient') {
          state.currentTenant = MOCK_TENANTS_DETAILED[0] || null;
        } else {
          state.currentTenant = null;
        }
      }),

    // ── UI Actions ──
    showToast: (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      set((state) => {
        state.toasts.push({ ...toast, id });
      });
      // Auto-remove after 4 seconds
      setTimeout(() => {
        set((state) => {
          state.toasts = state.toasts.filter((t) => t.id !== id);
        });
      }, 4000);
    },

    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      }),

    toggleSidebar: () =>
      set((state) => {
        state.isSidebarCollapsed = !state.isSidebarCollapsed;
      }),

    setWaitingRoomFilter: (filter) =>
      set((state) => {
        state.waitingRoomFilter = filter;
      }),

    setDoctorPreferences: (prefs) =>
      set((state) => {
        if (state.currentUser) {
          state.currentUser.preferences = {
            ...state.currentUser.preferences,
            ...prefs,
          } as any;
        }
      }),
  }))
);
