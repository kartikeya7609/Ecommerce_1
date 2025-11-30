import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:3002";

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      return {
        user: user || null,
        token: token || null,
        isAuthenticated: !!(token && user),
        isLoading: true,
      };
    } catch (error) {
      console.error("Error initializing auth state:", error);
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    }
  });

  const navigate = useNavigate();

  const clearAuthData = useCallback(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuth({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  }, []);

  const setAuthData = useCallback(
    (token, user) => {
      try {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setAuth({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error setting auth data:", error);
        clearAuthData();
      }
    },
    [clearAuthData]
  );

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const res = await axios.get("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = res.data?.user;
      if (!user || !user.id) {
        throw new Error("Invalid user");
      }

      setAuthData(token, user);
      return true;
    } catch (err) {
      console.error("Token verification failed:", err);
      return false;
    }
  }, [setAuthData]);

  const refreshLogin = useCallback(async () => {
    try {
      const res = await axios.post("/api/auth/refresh");
      const { accessToken, user } = res.data;

      if (!accessToken || !user) {
        throw new Error("Invalid refresh response");
      }

      setAuthData(accessToken, user);
      return true;
    } catch (err) {
      console.error("Refresh failed:", err);
      if (err.response?.status === 401 || err.response?.status === 500) {
        clearAuthData();
      }
      return false;
    }
  }, [setAuthData, clearAuthData]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "/api/auth/login",
        {
          email,
          password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { token, user } = response.data;
      setAuthData(token, user);
      toast.success("✅ Login successful!");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.error || "Login failed. Please try again.";
      toast.error(`❌ ${errorMessage}`);
      return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuthData();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    }
  }, [clearAuthData, navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        if (token && user) {
          const verified = await verifyToken();
          if (!verified) {
            const refreshed = await refreshLogin();
            if (!refreshed) {
              clearAuthData();
            }
          }
        } else {
          setAuth((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        clearAuthData();
      }
    };

    checkAuth();
  }, [verifyToken, refreshLogin, clearAuthData]);

  // Add axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshed = await refreshLogin();
            if (refreshed) {
              const token = localStorage.getItem("token");
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            clearAuthData();
            navigate("/login", { replace: true });
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshLogin, clearAuthData, navigate]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default AuthContext;
