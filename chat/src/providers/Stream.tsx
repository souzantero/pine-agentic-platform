import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { LogoSVG } from "@/components/icons/logo";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { useAuth } from "./Auth";
import { useLangGraphConfig } from "@/hooks/useLangGraphConfig";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
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
    ...(bearerToken && {
      defaultHeaders: {
        Authorization: `Bearer ${bearerToken}`,
      },
    }),
    onCustomEvent: (event, options) => {
      options.mutate((prev) => {
        const ui = uiMessageReducer(prev.ui ?? [], event);
        return { ...prev, ui };
      });
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
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code>.
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
  // Use shared hook for config
  const { apiUrl, assistantId } = useLangGraphConfig();

  // If we're missing any required values, show the configuration message
  if (!apiUrl || !assistantId) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full p-4">
        <div className="animate-in fade-in-0 zoom-in-95 flex flex-col border bg-background shadow-lg rounded-lg max-w-3xl">
          <div className="flex flex-col gap-2 mt-14 p-6 border-b">
            <div className="flex items-start flex-col gap-2">
              <LogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Pinechat
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to Pinechat! Please configure the required environment
              variables to get started.
            </p>
          </div>
          <div className="flex flex-col gap-6 p-6 bg-muted/50">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Missing Configuration</p>
              <p className="text-muted-foreground text-sm">
                Please set the following environment variables:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                {!apiUrl && (
                  <li>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      NEXT_PUBLIC_API_URL
                    </code>{" "}
                    - The URL of your LangGraph deployment
                  </li>
                )}
                {!assistantId && (
                  <li>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      NEXT_PUBLIC_ASSISTANT_ID
                    </code>{" "}
                    - The assistant / graph ID
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
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
