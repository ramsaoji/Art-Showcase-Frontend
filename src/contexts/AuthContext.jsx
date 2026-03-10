import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { trpc, trpcClient, setMemoryToken } from "@/lib/trpc";
import { getFriendlyErrorMessage } from "@/utils/formatters";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get tRPC utils for query invalidation
  const utils = trpc.useContext();

  // Helper: clear any leftover local token
  const clearLocalToken = () => {
    try {
      localStorage.removeItem("token");
    } catch { }
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

  // Fetch user info on mount. The cookie is automatically verified.
  useEffect(() => {
    async function fetchUser() {
      // If we already have user data, don't fetch again
      if (user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const me = await trpcClient.user.me.query();
        setUser(me);
      } catch (err) {
        setUser(null);
        clearLocalToken();
        setMemoryToken(null);
        // Clear all artwork-related localStorage data on session expiration
        clearArtworkLocalStorage();
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    // eslint-disable-next-line
  }, []);

  // Login function
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const res = await trpcClient.user.login.mutate({ email, password });
        // Instead of saving token to localStorage, we rely on the HttpOnly cookie the backend sets
        clearLocalToken();

        // Enterprise solution: store token in memory to gracefully handle browser cookie propagation delays
        // This bypasses 401 race conditions instantly globally.
        if (res.token) {
          setMemoryToken(res.token);
        }

        setUser(res.user);

        // Reset queries to ensure fresh data and show loading state
        // This solves the issue of stale data when switching users/roles
        utils.reset();

        return res.user;
      } catch (err) {
        setError(getFriendlyErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [utils]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      await trpcClient.user.logout.mutate();
    } catch (err) {
      console.error("Logout request failed", err);
    }

    // Clear user state
    setUser(null);
    clearLocalToken();
    setMemoryToken(null);

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
    }),
    [user, isSuperAdmin, isArtist, login, logout, loading, error, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
