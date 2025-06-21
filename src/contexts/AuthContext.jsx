import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { trpc, trpcClient } from "../utils/trpc";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: set token in localStorage and state
  const saveToken = (jwt) => {
    setToken(jwt);
    if (jwt) {
      localStorage.setItem("token", jwt);
    } else {
      localStorage.removeItem("token");
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
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    // eslint-disable-next-line
  }, [token, user]);

  // Login function
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await trpcClient.user.login.mutate({ email, password });
      saveToken(res.token);
      setUser(res.user);
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
        console.error("Error parsing error message:", parseError);
      }

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Clear token and user state
    saveToken(null);
    setUser(null);

    // Clear all artwork-related localStorage data
    const keysToRemove = [];

    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Remove artwork form data, dimensions, and artist ID keys
        if (
          key.includes("artwork_form_data") ||
          key.includes("artwork_dimensions") ||
          key.includes("artwork_artist_id")
        ) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove the identified keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }, []);

  // Clear error function for external use
  const clearError = useCallback(() => setError(null), []);

  // Role helpers
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isArtist = user?.role === "ARTIST";

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
