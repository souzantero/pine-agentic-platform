// Gestão de dados no localStorage
// Centraliza o acesso ao storage para token JWT, organização atual e configurações de threads

const TOKEN_KEY = "pineai_token";
const CURRENT_ORG_KEY = "pineai_current_org";
const THREAD_CONFIG_PREFIX = "pineai_thread_";
const MENU_EXPANDED_KEY = "pineai_menu_expanded";

// Token JWT
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// Organização atual
export function getCurrentOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_ORG_KEY);
}

export function setCurrentOrgId(orgId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_ORG_KEY, orgId);
}

export function clearCurrentOrgId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_ORG_KEY);
}

// Configurações específicas por thread
// Chave: pineai_thread_{threadId}
export function getThreadConfig<T>(threadId: string): T | null {
  if (typeof window === "undefined") return null;
  const key = THREAD_CONFIG_PREFIX + threadId;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

export function setThreadConfig<T>(threadId: string, config: T): void {
  if (typeof window === "undefined") return;
  const key = THREAD_CONFIG_PREFIX + threadId;
  localStorage.setItem(key, JSON.stringify(config));
}

export function clearThreadConfig(threadId: string): void {
  if (typeof window === "undefined") return;
  const key = THREAD_CONFIG_PREFIX + threadId;
  localStorage.removeItem(key);
}

// Estado do menu da sidebar (expandido/colapsado)
export function getMenuExpanded(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(MENU_EXPANDED_KEY);
  return stored !== null ? stored === "true" : true;
}

export function setMenuExpanded(expanded: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MENU_EXPANDED_KEY, String(expanded));
}
