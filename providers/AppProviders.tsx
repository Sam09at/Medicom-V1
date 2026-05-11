import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '../router';
import { ToastContainer } from '../components/Toast';
import { useMedicomStore } from '../store';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchProfileForUserId } from '../lib/api/auth';
import type { UserRole } from '../types';

/**
 * Top-level provider wrapper.
 *
 * Auth rehydration strategy:
 * - Mock mode: role is saved to sessionStorage on login; restored here on mount.
 * - Real mode: supabase.auth.onAuthStateChange is the single source of truth.
 *   INITIAL_SESSION fires immediately on subscription with the stored session,
 *   covering both fresh loads and page refreshes without a race condition.
 */
export const AppProviders: React.FC = () => {
  const toasts = useMedicomStore((s) => s.toasts);
  const removeToast = useMedicomStore((s) => s.removeToast);
  const setCurrentUser = useMedicomStore((s) => s.setCurrentUser);
  const setCurrentTenant = useMedicomStore((s) => s.setCurrentTenant);
  const setAuthLoading = useMedicomStore((s) => s.setAuthLoading);
  const initializeFromMock = useMedicomStore((s) => s.initializeFromMock);

  useEffect(() => {
    // ── Mock mode ──────────────────────────────────────────────────────────────
    if (!isSupabaseConfigured) {
      const savedRole = sessionStorage.getItem('medicom_mock_role') as UserRole | null;
      if (savedRole) {
        // Restore the mock session from the previous page load.
        initializeFromMock(savedRole);
      } else {
        // No saved session — show the login page.
        setAuthLoading(false);
      }
      return;
    }

    // ── Real Supabase mode ─────────────────────────────────────────────────────
    // onAuthStateChange fires INITIAL_SESSION synchronously on registration with
    // the session already in storage. This covers page refresh without any race.
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          try {
            const profile = await fetchProfileForUserId(session.user.id);
            setCurrentUser(profile.user);
            setCurrentTenant(profile.tenant);
          } catch (err) {
            // Profile fetch failed (e.g. public.users row missing).
            // Keep isAuthLoading = false so the user sees the login page
            // rather than hanging on a spinner.
            console.error('[Auth] Session restore failed:', err);
            setCurrentUser(null);
            setCurrentTenant(null);
          }
        }
        // Always unblock the UI after the initial session check.
        setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentTenant(null);
        setAuthLoading(false);
      }
      // SIGNED_IN: LoginPage already sets currentUser after signIn() resolves.
      // TOKEN_REFRESHED: Supabase SDK handles silently; no UI state change needed.
    });

    const channel = supabase!
      .channel('public-bookings-badge')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: 'source=eq.public_booking',
        },
        () => useMedicomStore.getState().incrementPublicBookings()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase!.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <RouterProvider router={router} />
    </>
  );
};
