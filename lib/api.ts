// API Client para comunicação com o backend Python
// Gerencia autenticação JWT automaticamente

import { getToken } from "./storage";
import type { StreamPayload, AgentMessage } from "./types";

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

// Funcao para buscar mensagens de uma thread
export async function getThreadMessages(
  organizationId: string,
  threadId: string
): Promise<{ data?: { messages: AgentMessage[] }; error?: string }> {
  const endpoint = `/organizations/${organizationId}/threads/${threadId}/state/messages`;
  return api.get<{ messages: AgentMessage[] }>(endpoint);
}

// Tipos para eventos de streaming
interface StreamEvent {
  event: "chunk" | "status" | "final" | "done" | "error";
  content?: string;
  messages?: AgentMessage[];
  detail?: string;
}

// Callbacks para streaming
export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onStatus?: (status: string) => void;
  onFinal: (messages: AgentMessage[]) => void;
  onError: (error: string) => void;
}

// Funcao para streaming de execucao
export async function streamRun(
  organizationId: string,
  threadId: string,
  payload: StreamPayload,
  callbacks: StreamCallbacks
): Promise<void> {
  const token = getToken();
  const endpoint = `${API_URL}/organizations/${organizationId}/threads/${threadId}/runs/stream`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let errorMessage = "Erro ao conectar com o servidor";
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.detail || errorMessage;
      } catch {
        if (text) errorMessage = text;
      }
      callbacks.onError(errorMessage);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError("Streaming não suportado");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Processa linhas completas (SSE format: data: {...}\n\n)
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        try {
          const jsonStr = line.slice(6); // Remove "data: "
          const event: StreamEvent = JSON.parse(jsonStr);

          switch (event.event) {
            case "chunk":
              if (event.content) {
                callbacks.onChunk(event.content);
              }
              break;
            case "status":
              if (callbacks.onStatus) {
                callbacks.onStatus(event.content || "");
              }
              break;
            case "final":
              if (event.messages) {
                callbacks.onFinal(event.messages);
              }
              break;
            case "error":
              callbacks.onError(event.detail || "Erro desconhecido");
              break;
            case "done":
              // Stream finalizado
              break;
          }
        } catch {
          // Ignora linhas que nao sao JSON valido
        }
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao conectar com o servidor";
    callbacks.onError(errorMessage);
  }
}
