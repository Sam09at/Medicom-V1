import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '../router';
import { ToastContainer } from '../components/Toast';
import { useMedicomStore } from '../store';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchCurrentUserProfile } from '../lib/api/auth';

/**
 * Top-level provider wrapper.
 *
 * Responsibilities:
 * 1. On mount: rehydrate a Supabase session from cookies/localStorage so that
 *    a hard-refresh with a valid session doesn't bounce to the login page.
 * 2. Subscribe to Supabase auth state changes to handle multi-tab sign-out
 *    and token refresh.
 * 3. In mock mode (isSupabaseConfigured = false): clear the loading flag
 *    immediately so MockLoginPicker renders without delay.
 */
export const AppProviders: React.FC = () => {
  const toasts = useMedicomStore((s) => s.toasts);
  const removeToast = useMedicomStore((s) => s.removeToast);
  const setCurrentUser = useMedicomStore((s) => s.setCurrentUser);
  const setCurrentTenant = useMedicomStore((s) => s.setCurrentTenant);
  const setAuthLoading = useMedicomStore((s) => s.setAuthLoading);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock mode: no session to rehydrate — clear the loading flag immediately
      // so the MockLoginPicker renders without waiting for a network call.
      setAuthLoading(false);
      return;
    }

    // Attempt to restore an existing session on first load.
    // Uses getSession() (reads from localStorage) not getUser() (network call).
    fetchCurrentUserProfile()
      .then((profile) => {
        if (profile) {
          setCurrentUser(profile.user);
          setCurrentTenant(profile.tenant);
        }
      })
      .catch(() => {
        // Invalid or expired session — currentUser stays null → login page.
      })
      .finally(() => {
        // Always clear the loading flag, even on error, so the UI unblocks.
        setAuthLoading(false);
      });

    // Subscribe to future auth state changes:
    // - SIGNED_OUT: another tab or the server invalidated the session
    // - Other events (SIGNED_IN, TOKEN_REFRESHED) are handled by LoginPage
    //   and fetchCurrentUserProfile above — no double-fetch needed here.
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentTenant(null);
      }
    });

    const channel = supabase!
      .channel('public-bookings-badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments', filter: 'source=eq.public_booking' },
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
