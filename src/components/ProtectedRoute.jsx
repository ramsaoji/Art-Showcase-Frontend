import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loader from "./ui/Loader";

export default function ProtectedRoute({
  children,
  requireRole,
  superAdminOnly,
}) {
  const { user, role, isSuperAdmin, isArtist, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
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
