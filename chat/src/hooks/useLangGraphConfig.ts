import { useQueryState } from "nuqs";

interface LangGraphConfig {
  apiUrl: string | null;
  assistantId: string | null;
  finalApiUrl: string | undefined;
  finalAssistantId: string | undefined;
}

export function useLangGraphConfig(): LangGraphConfig {
  // Get from query params
  const [apiUrl] = useQueryState("apiUrl");
  const [assistantId] = useQueryState("assistantId");

  // Get environment variables
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined = process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use final values with env var fallbacks
  const finalApiUrl = apiUrl || envApiUrl;
  const finalAssistantId = assistantId || envAssistantId;

  return {
    apiUrl,
    assistantId,
    finalApiUrl,
    finalAssistantId,
  };
}
