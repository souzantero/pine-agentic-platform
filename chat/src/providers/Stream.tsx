import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  isUIMessage,
  isRemoveUIMessage,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { useAuth } from "./Auth";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  bearerToken?: string,
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};

    if (bearerToken) {
      headers["Authorization"] = `Bearer ${bearerToken}`;
    }

    const res = await fetch(`${apiUrl}/info`, {
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getThreads, setThreads } = useThreads();
  const { session } = useAuth();

  // Get the Supabase access token
  const bearerToken = session?.access_token;

  const streamValue = useTypedStream({
    apiUrl,
    assistantId,
    threadId: threadId ?? null,
    fetchStateHistory: true,
    ...(bearerToken && {
      defaultHeaders: {
        Authorization: `Bearer ${bearerToken}`,
      },
    }),
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          const ui = uiMessageReducer(prev.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },
    onThreadId: (id) => {
      setThreadId(id);
      // Refetch threads list when thread ID changes.
      // Wait for some seconds before fetching so we're able to get the new thread that was created.
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  useEffect(() => {
    checkGraphStatus(apiUrl, bearerToken).then((ok) => {
      if (!ok) {
        toast.error("Falha ao conectar ao servidor", {
          description: () => (
            <p>
              Por favor, certifique-se de que seu grafo está sendo executado em <code>{apiUrl}</code>.
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiUrl, bearerToken]);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const assistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Validate required environment variables
  if (!apiUrl || !assistantId) {
    throw new Error(
      "Variáveis de ambiente obrigatórias ausentes: NEXT_PUBLIC_API_URL e NEXT_PUBLIC_ASSISTANT_ID devem estar configuradas"
    );
  }

  return (
    <StreamSession apiUrl={apiUrl} assistantId={assistantId}>
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
