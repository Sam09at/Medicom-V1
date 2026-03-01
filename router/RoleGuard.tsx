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
 * - No user → redirect to '/' (login picker / real login in prod)
 * - Wrong role → redirects to /unauthorized
 * - Correct role → renders children
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const currentUser = useMedicomStore((s) => s.currentUser);
  const location = useLocation();

  // No user logged in → go to root (login)
  // Using Navigate instead of rendering MockLoginPicker inline prevents stale
  // role checks when the store clears on logout and the previous route re-renders.
  if (!currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Wrong role → unauthorized page
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
