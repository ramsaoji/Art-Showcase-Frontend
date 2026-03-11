import React, { memo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RouteSuspenseFallback from "@/components/common/RouteSuspenseFallback";

/**
 * ProtectedRoute
 * Guards a route by authentication state, optional role, and optional superAdminOnly flag.
 * Renders a full-screen loader while auth is resolving, then redirects to /login
 * if unauthenticated or to / if the required role/admin check fails.
 *
 * @param {React.ReactElement} props.children - The route content to render when access is granted.
 * @param {string} [props.requireRole] - If set, only users with this role can access the route.
 * @param {boolean} [props.superAdminOnly] - If true, only super admins can access the route.
 */
function ProtectedRoute({
  children,
  requireRole,
  superAdminOnly,
}) {
  const { user, role, isSuperAdmin, loading } = useAuth();

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

  // If superAdminOnly, only allow super admins
  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required, check it
  if (requireRole && role !== requireRole) {
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
