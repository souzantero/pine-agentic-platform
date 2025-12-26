"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Tipos
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type Permission =
  | "CONVERSATIONS_READ"
  | "CONVERSATIONS_WRITE"
  | "CONVERSATIONS_DELETE"
  | "AGENTS_READ"
  | "AGENTS_WRITE"
  | "AGENTS_DELETE"
  | "MEMBERS_READ"
  | "MEMBERS_INVITE"
  | "MEMBERS_MANAGE"
  | "ROLES_MANAGE"
  | "ORGANIZATION_MANAGE"
  | "PLATFORM_MANAGE";

export type RoleScope = "PLATFORM" | "ORGANIZATION";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  scope: RoleScope;
  isSystemRole: boolean;
  permissions: Permission[];
}

export interface Membership {
  id: string;
  isOwner: boolean;
  createdAt: string;
  organization: Organization;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  memberships: Membership[];
  currentMembership: Membership | null;
  hasOrganization: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  createOrganization: (
    name: string,
    slug: string
  ) => Promise<{ error?: string; organization?: Organization }>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setUser(data.user);
      setMemberships(data.memberships || []);
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

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

        // Recarregar sessão para obter memberships
        await loadSession();
        return {};
      } catch (error) {
        console.error("Sign in error:", error);
        return { error: "Erro ao conectar com o servidor" };
      }
    },
    [loadSession]
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
        setMemberships([]); // Novo usuário não tem organizações
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
      setMemberships([]);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  const createOrganization = useCallback(
    async (
      name: string,
      slug: string
    ): Promise<{ error?: string; organization?: Organization }> => {
      try {
        const response = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { error: data.error };
        }

        // Recarregar sessão para atualizar memberships
        await loadSession();
        return { organization: data.organization };
      } catch (error) {
        console.error("Create organization error:", error);
        return { error: "Erro ao criar organização" };
      }
    },
    [loadSession]
  );

  const refreshSession = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  // Primeira membership como "atual" (por enquanto)
  const currentMembership = memberships.length > 0 ? memberships[0] : null;
  const hasOrganization = memberships.length > 0;

  // Verificar se o usuário tem uma permissão específica na org atual
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentMembership) return false;
      // Owner tem todas as permissões
      if (currentMembership.isOwner) return true;
      return currentMembership.role.permissions.includes(permission);
    },
    [currentMembership]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        currentMembership,
        hasOrganization,
        isLoggedIn: user !== null,
        isLoading,
        signIn,
        signUp,
        signOut,
        createOrganization,
        refreshSession,
        hasPermission,
      }}
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
