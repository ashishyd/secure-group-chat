"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/types";

/**
 * Defines the structure of the authentication context.
 */
interface AuthContextType {
  /** The currently authenticated user or null if not authenticated. */
  user: User | null;
  /** Indicates whether the authentication data is still loading. */
  loading: boolean;
  /** Indicates whether the user is authenticated. */
  isAuthenticated: boolean;
  /** Refreshes the user data by fetching it from the server. */
  refreshUser: () => Promise<void>;
  /** Updates the user state. */
  setUser: (user: User) => void;
}

/**
 * Creates the authentication context with default values.
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  refreshUser: async () => {},
  setUser: () => {},
});

/**
 * Provides the authentication context to its children.
 * Handles user state, loading state, and authentication logic.
 *
 * @param children - The child components that will consume the context.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the current user data from the server and updates the state.
   * Sets the loading state during the fetch operation.
   */
  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetches the user data when the component mounts.
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access the authentication context.
 *
 * @returns The authentication context value.
 */
export const useAuth = () => useContext(AuthContext);
