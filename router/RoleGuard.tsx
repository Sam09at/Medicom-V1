import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../types';
import { useMedicomStore } from '../store';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Route guard that checks user role before rendering children.
 * - Auth still loading → full-screen spinner (prevents flash of login page)
 * - No user → redirect to /login
 * - Wrong role → redirect to /unauthorized
 * - Correct role → renders children
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const currentUser = useMedicomStore((s) => s.currentUser);
  const isAuthLoading = useMedicomStore((s) => s.isAuthLoading);
  const location = useLocation();

  // While Supabase session is resolving, show a spinner rather than bouncing
  // the user to /login (which would happen because currentUser is still null).
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
