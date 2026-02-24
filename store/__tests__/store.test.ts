import { describe, it, expect, beforeEach } from 'vitest';
import { useMedicomStore } from '../index';

// Reset the store before each test
beforeEach(() => {
  useMedicomStore.setState({
    currentUser: null,
    currentTenant: null,
    isAuthLoading: true,
    toasts: [],
    isSidebarCollapsed: false,
  });
});

describe('Zustand Store — Auth Actions', () => {
  it('setCurrentUser sets user', () => {
    const mockUser = {
      id: 'u1',
      name: 'Test User',
      role: 'doctor' as const,
      avatar: '',
    };
    useMedicomStore.getState().setCurrentUser(mockUser as any);
    expect(useMedicomStore.getState().currentUser).toEqual(mockUser);
  });

  it('setCurrentUser(null) clears user', () => {
    useMedicomStore
      .getState()
      .setCurrentUser({ id: 'u1', name: 'X', role: 'doctor', avatar: '' } as any);
    useMedicomStore.getState().setCurrentUser(null);
    expect(useMedicomStore.getState().currentUser).toBeNull();
  });

  it('setCurrentTenant sets tenant', () => {
    const tenant = { id: 't1', name: 'Test Clinic' };
    useMedicomStore.getState().setCurrentTenant(tenant as any);
    expect(useMedicomStore.getState().currentTenant).toEqual(tenant);
  });

  it('setAuthLoading toggles loading state', () => {
    expect(useMedicomStore.getState().isAuthLoading).toBe(true);
    useMedicomStore.getState().setAuthLoading(false);
    expect(useMedicomStore.getState().isAuthLoading).toBe(false);
  });
});

describe('Zustand Store — initializeFromMock', () => {
  it('initializes doctor role', () => {
    useMedicomStore.getState().initializeFromMock('doctor');
    const state = useMedicomStore.getState();
    expect(state.currentUser).not.toBeNull();
    expect(state.currentUser?.role).toBe('doctor');
    expect(state.isAuthLoading).toBe(false);
    expect(state.currentTenant).not.toBeNull();
  });

  it('initializes staff role', () => {
    useMedicomStore.getState().initializeFromMock('staff');
    const state = useMedicomStore.getState();
    expect(state.currentUser).not.toBeNull();
    expect(state.currentUser?.role).toBe('staff');
    expect(state.currentTenant).not.toBeNull();
  });

  it('initializes super_admin — no tenant', () => {
    useMedicomStore.getState().initializeFromMock('super_admin');
    const state = useMedicomStore.getState();
    expect(state.currentUser?.role).toBe('super_admin');
    expect(state.currentTenant).toBeNull();
  });

  it('initializes clinic_admin with tenant', () => {
    useMedicomStore.getState().initializeFromMock('clinic_admin');
    const state = useMedicomStore.getState();
    expect(state.currentUser?.role).toBe('clinic_admin');
    expect(state.currentTenant).not.toBeNull();
  });
});

describe('Zustand Store — UI Actions', () => {
  it('showToast adds toast', () => {
    useMedicomStore.getState().showToast({
      type: 'success',
      message: 'Operation completed',
    });
    const toasts = useMedicomStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Operation completed');
    expect(toasts[0].id).toBeDefined();
  });

  it('removeToast removes specific toast', () => {
    useMedicomStore.getState().showToast({
      type: 'error',
      message: 'fail',
    });
    const id = useMedicomStore.getState().toasts[0].id;
    useMedicomStore.getState().removeToast(id);
    expect(useMedicomStore.getState().toasts).toHaveLength(0);
  });

  it('toggleSidebar toggles collapsed state', () => {
    expect(useMedicomStore.getState().isSidebarCollapsed).toBe(false);
    useMedicomStore.getState().toggleSidebar();
    expect(useMedicomStore.getState().isSidebarCollapsed).toBe(true);
    useMedicomStore.getState().toggleSidebar();
    expect(useMedicomStore.getState().isSidebarCollapsed).toBe(false);
  });
});
