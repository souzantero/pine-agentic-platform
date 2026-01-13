// API Client para comunicação com o backend Python
// Gerencia autenticação JWT automaticamente

import { getToken } from "./storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";

// Tipo para respostas de erro do FastAPI
interface ApiError {
  detail?: string;
  error?: string;
}

// Função auxiliar para fazer requisições com autenticação
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Adiciona token de autenticação se disponível
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Tenta parsear o JSON da resposta
    let data: T | ApiError | undefined;
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");

    // Só tenta parsear JSON se houver conteúdo
    if (contentType?.includes("application/json") && contentLength !== "0" && response.status !== 204) {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    }

    if (!response.ok) {
      // Normaliza erro do FastAPI (detail) para formato esperado (error)
      const errorData = data as ApiError;
      const errorMessage =
        errorData?.detail || errorData?.error || "Erro desconhecido";
      return { error: errorMessage, status: response.status };
    }

    return { data: data as T, status: response.status };
  } catch (error) {
    console.error("API request error:", error);
    return { error: "Erro ao conectar com o servidor", status: 0 };
  }
}

// Métodos HTTP convenientes
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
