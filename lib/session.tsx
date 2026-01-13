"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "./api";
import {
  getToken,
  setToken,
  clearToken,
  getCurrentOrgId,
  setCurrentOrgId as saveCurrentOrgId,
  clearCurrentOrgId,
} from "./storage";

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
  | "PLATFORM_MANAGE"
  | "PROMPTS_READ"
  | "PROMPTS_WRITE"
  | "PROMPTS_DELETE";

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

interface SessionContextType {
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
  switchOrganization: (organizationId: string) => Promise<{ error?: string }>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async (skipLoadingState = false) => {
    if (!skipLoadingState) {
      setIsLoading(true);
    }

    try {
      // Verificar se há token antes de fazer requisição
      const token = getToken();
      if (!token) {
        setUser(null);
        setMemberships([]);
        setCurrentOrgId(null);
        return;
      }

      // Carregar sessão do backend
      const sessionRes = await api.get<{
        user: User;
        memberships: Membership[];
      }>("/auth/me");

      // Se token expirado ou inválido, limpar estado
      if (sessionRes.status === 401) {
        clearToken();
        clearCurrentOrgId();
        setUser(null);
        setMemberships([]);
        setCurrentOrgId(null);
        return;
      }

      if (sessionRes.data) {
        setUser(sessionRes.data.user);
        const userMemberships = sessionRes.data.memberships || [];
        setMemberships(userMemberships);

        // Carregar org atual do localStorage e validar
        const savedOrgId = getCurrentOrgId();
        const isValidOrg = userMemberships.some(
          (m) => m.organizationId === savedOrgId
        );

        if (savedOrgId && isValidOrg) {
          setCurrentOrgId(savedOrgId);
        } else if (userMemberships.length > 0) {
          // Se não há org salva ou não é mais membro, usar a primeira
          const firstOrgId = userMemberships[0].organizationId;
          setCurrentOrgId(firstOrgId);
          saveCurrentOrgId(firstOrgId);
        } else {
          setCurrentOrgId(null);
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
        const response = await api.post<{
          accessToken: string;
          tokenType: string;
        }>("/auth/login", { email, password });

        if (response.error) {
          return { error: response.error };
        }

        if (response.data?.accessToken) {
          // Salvar token JWT no localStorage
          setToken(response.data.accessToken);
          // Carregar dados do usuário
          await loadSession();
        }

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
        const response = await api.post<{
          accessToken: string;
          tokenType: string;
        }>("/auth/register", { email, name: name || email.split("@")[0], password });

        if (response.error) {
          return { error: response.error };
        }

        if (response.data?.accessToken) {
          // Salvar token JWT no localStorage
          setToken(response.data.accessToken);
          // Carregar dados do usuário
          await loadSession();
        }

        return {};
      } catch (error) {
        console.error("Sign up error:", error);
        return { error: "Erro ao conectar com o servidor" };
      }
    },
    [loadSession]
  );

  const signOut = useCallback(async () => {
    // JWT é stateless - apenas limpar dados locais
    clearToken();
    clearCurrentOrgId();
    setUser(null);
    setMemberships([]);
    setCurrentOrgId(null);
  }, []);

  const refreshSession = useCallback(async () => {
    await loadSession(true); // Não mostrar loading ao atualizar
  }, [loadSession]);

  const switchOrganization = useCallback(
    async (organizationId: string): Promise<{ error?: string }> => {
      // Verificar se o usuário é membro desta org
      const isMember = memberships.some(
        (m) => m.organizationId === organizationId
      );

      if (!isMember) {
        return { error: "Você não é membro desta organização" };
      }

      // Salvar no localStorage e atualizar estado
      saveCurrentOrgId(organizationId);
      setCurrentOrgId(organizationId);
      return {};
    },
    [memberships]
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
    <SessionContext.Provider
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
        switchOrganization,
        refreshSession,
        hasPermission,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
