import React, { memo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RouteSuspenseFallback from "@/components/common/RouteSuspenseFallback";

/**
 * ProtectedRoute
 * Guards a route by authentication state, permission requirements, and
 * optional account-state restrictions.
 * Renders a full-screen loader while auth is resolving, then redirects to /login
 * if unauthenticated or to / if the permission or state checks fail.
 *
 * @param {React.ReactElement} props.children - The route content to render when access is granted.
 */
function ProtectedRoute({
  children,
  requireAnyPermission,
  requireAllPermissions,
  allowAccountStates,
}) {
  const { user, loading, can, accountState } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen">
        <RouteSuspenseFallback />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    Array.isArray(allowAccountStates) &&
    allowAccountStates.length > 0 &&
    !allowAccountStates.includes(accountState)
  ) {
    return <Navigate to="/" replace />;
  }

  if (
    Array.isArray(requireAnyPermission) &&
    requireAnyPermission.length > 0 &&
    !requireAnyPermission.some((permission) => can(permission))
  ) {
    return <Navigate to="/" replace />;
  }

  if (
    Array.isArray(requireAllPermissions) &&
    requireAllPermissions.length > 0 &&
    !requireAllPermissions.every((permission) => can(permission))
  ) {
    return <Navigate to="/" replace />;
  }

  // Ensure children is a valid React element
  if (!React.isValidElement(children)) {
    throw new Error("ProtectedRoute children must be a valid React element.");
  }

  return children;
}

ProtectedRoute.displayName = "ProtectedRoute";
export default memo(ProtectedRoute);
