import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '../router';
import { ToastContainer } from '../components/Toast';
import { useMedicomStore } from '../store';

/**
 * Top-level provider wrapper.
 * Future: add QueryClientProvider (react-query), ThemeProvider, etc.
 */
export const AppProviders: React.FC = () => {
  const toasts = useMedicomStore((s) => s.toasts);
  const removeToast = useMedicomStore((s) => s.removeToast);

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <RouterProvider router={router} />
    </>
  );
};
