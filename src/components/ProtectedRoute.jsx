import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loader from "./ui/Loader";

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  // If not authenticated or not admin, redirect to login
  if (!user || !isAdmin) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/login" replace />;
  }

  return children;
}
