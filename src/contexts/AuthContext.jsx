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
  }, [token]);

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
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    saveToken(null);
    setUser(null);
  }, []);

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
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
