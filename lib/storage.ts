// Gestão de dados no localStorage
// Centraliza o acesso ao storage para token JWT e organização atual

const TOKEN_KEY = "pinechat_token";
const CURRENT_ORG_KEY = "pinechat_current_org";

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
