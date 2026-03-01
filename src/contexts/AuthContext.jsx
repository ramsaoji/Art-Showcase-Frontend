import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { trpc, trpcClient } from "@/lib/trpc";

const AuthContext = createContext();

/** Returns the current AuthContext value. Must be used inside AuthProvider. */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Provides authentication state (user, role, token) and actions (login, logout)
 * to the entire component tree.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get tRPC utils for query invalidation
  const utils = trpc.useContext();

  // Helper: set token in localStorage and state (try/catch per Vercel 4.4 - localStorage can throw)
  const saveToken = (jwt) => {
    setToken(jwt);
    try {
      if (jwt) {
        localStorage.setItem("token", jwt);
      } else {
        localStorage.removeItem("token");
      }
    } catch {
      // Ignore in incognito, quota exceeded, or disabled
    }
  };

  // Helper: clear all artwork-related localStorage data (try/catch per Vercel 4.4)
  const clearArtworkLocalStorage = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("artwork_form_data") || key.includes("artwork_dimensions") || key.includes("artwork_artist_id"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore in incognito or when storage is disabled
    }
  };

  // Fetch user info if token exists
  useEffect(() => {
    async function fetchUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // If we already have user data, don't fetch again
      if (user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Call /user.me with Authorization header
        const me = await trpcClient.user.me.query(undefined, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(me);
      } catch (err) {
        setUser(null);
        saveToken(null);
        setError("Session expired. Please log in again.");

        // Clear all artwork-related localStorage data on session expiration
        clearArtworkLocalStorage();
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    // eslint-disable-next-line
  }, [token]);

  // Login function
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const res = await trpcClient.user.login.mutate({ email, password });
        saveToken(res.token);
        setUser(res.user);

        // Reset queries to ensure fresh data and show loading state
        // This solves the issue of stale data when switching users/roles
        utils.reset();

        return res.user;
      } catch (err) {
        // Parse error message if it's a JSON string (validation error)
        let errorMessage = err.message || "Login failed";
        try {
          // Check if the error message is a JSON string
          if (errorMessage.startsWith("[") && errorMessage.includes("code")) {
            const parsedError = JSON.parse(errorMessage);
            // Handle validation errors
            if (
              parsedError[0]?.code === "too_small" &&
              parsedError[0]?.path?.includes("password")
            ) {
              errorMessage = `Password must contain at least ${parsedError[0].minimum} characters`;
            }
          }
        } catch (parseError) {
          // If parsing fails, use the original error message
        }

        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [utils]
  );

  // Logout function
  const logout = useCallback(() => {
    // Clear token and user state
    saveToken(null);
    setUser(null);

    // Clear all artwork-related localStorage data
    clearArtworkLocalStorage();

    // Reset all queries to ensure fresh public data is fetched and show loading state
    utils.reset();
  }, [utils]);

  // Clear error function for external use
  const clearError = useCallback(() => setError(null), []);

  // Role helpers
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isArtist = user?.role === "ARTIST";

  const value = useMemo(
    () => ({
      user,
      role: user?.role,
      isSuperAdmin,
      isArtist,
      login,
      logout,
      loading,
      error,
      clearError,
      token,
    }),
    [user, isSuperAdmin, isArtist, login, logout, loading, error, clearError, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
