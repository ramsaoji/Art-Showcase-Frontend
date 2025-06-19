import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loader from "./ui/Loader";

export default function ProtectedRoute({ children, requireRole }) {
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

  // If a specific role is required, check it
  if (requireRole && role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
