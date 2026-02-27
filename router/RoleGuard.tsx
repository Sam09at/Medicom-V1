import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../types';
import { useMedicomStore } from '../store';
import { MockLoginPicker } from '../dev/MockLoginPicker';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Route guard that checks user role before rendering children.
 * - No user → shows MockLoginPicker (Phase 14 will redirect to /login)
 * - Wrong role → redirects to /unauthorized
 * - Correct role → renders children
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const currentUser = useMedicomStore((s) => s.currentUser);
  const location = useLocation();

  // No user logged in → show dev login picker
  if (!currentUser) {
    return <MockLoginPicker />;
  }

  // Wrong role → redirect
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
