"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { error: data.error };
        }

        setUser(data.user);
        return {};
      } catch (error) {
        console.error("Sign in error:", error);
        return { error: "Erro ao conectar com o servidor" };
      }
    },
    []
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name?: string
    ): Promise<{ error?: string }> => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { error: data.error };
        }

        setUser(data.user);
        return {};
      } catch (error) {
        console.error("Sign up error:", error);
        return { error: "Erro ao conectar com o servidor" };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: user !== null, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
