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
  | "THREADS_READ"
  | "THREADS_WRITE"
  | "THREADS_DELETE"
  | "AGENTS_READ"
  | "AGENTS_WRITE"
  | "AGENTS_DELETE"
  | "MEMBERS_READ"
  | "MEMBERS_INVITE"
  | "MEMBERS_MANAGE"
  | "ROLES_READ"
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
  organizationId: string;
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
  switchOrganization: (organizationId: string) => Promise<{ error?: string }>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      // Carregar sessão e org ativa em paralelo
      const [sessionRes, currentOrgRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/organizations/current"),
      ]);

      const sessionData = await sessionRes.json();
      setUser(sessionData.user);
      setMemberships(sessionData.memberships || []);

      if (currentOrgRes.ok) {
        const currentOrgData = await currentOrgRes.json();
        if (currentOrgData.currentOrganization) {
          setCurrentOrgId(currentOrgData.currentOrganization.organizationId);
        }
      }
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

  const switchOrganization = useCallback(
    async (organizationId: string): Promise<{ error?: string }> => {
      try {
        const response = await fetch("/api/organizations/current", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { error: data.error };
        }

        setCurrentOrgId(organizationId);
        return {};
      } catch (error) {
        console.error("Switch organization error:", error);
        return { error: "Erro ao trocar organização" };
      }
    },
    []
  );

  // Encontrar membership atual baseado no currentOrgId
  const currentMembership = memberships.find(
    (m) => m.organizationId === currentOrgId
  ) ?? memberships[0] ?? null;

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
        switchOrganization,
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
