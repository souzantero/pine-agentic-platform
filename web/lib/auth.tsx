"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
  password: string; // Armazenado apenas para mock
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "pinechat_users";
const LOGGED_USER_KEY = "pinechat_logged_user";

// Store para usuários registrados
function getRegisteredUsers(): User[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveRegisteredUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Store para usuário logado
let listeners: Array<() => void> = [];
let cachedLoggedUser: User | null = null;
let initialized = false;

function getLoggedUser(): User | null {
  if (typeof window === "undefined") return null;
  if (!initialized) {
    const stored = localStorage.getItem(LOGGED_USER_KEY);
    cachedLoggedUser = stored ? JSON.parse(stored) : null;
    initialized = true;
  }
  return cachedLoggedUser;
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function setLoggedUser(user: User | null) {
  cachedLoggedUser = user;
  if (user) {
    localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOGGED_USER_KEY);
  }
  listeners.forEach((listener) => listener());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getLoggedUser, () => null);
  const isLoggedIn = user !== null;

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!email || !password) {
      return { error: "Email e senha são obrigatórios" };
    }

    const users = getRegisteredUsers();
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      return { error: "Usuário não encontrado. Cadastre-se primeiro." };
    }

    if (foundUser.password !== password) {
      return { error: "Senha incorreta" };
    }

    setLoggedUser(foundUser);
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!email || !password) {
      return { error: "Email e senha são obrigatórios" };
    }

    if (password.length < 6) {
      return { error: "A senha deve ter pelo menos 6 caracteres" };
    }

    const users = getRegisteredUsers();
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return { error: "Este email já está cadastrado" };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name: email.split("@")[0],
      password,
    };

    saveRegisteredUsers([...users, newUser]);
    setLoggedUser(newUser);
    return {};
  }, []);

  const signOut = useCallback(async () => {
    setLoggedUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading: false, signIn, signUp, signOut }}>
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
