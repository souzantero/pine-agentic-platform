interface LangGraphConfig {
  apiUrl: string | undefined;
  assistantId: string | undefined;
}

export function useLangGraphConfig(): LangGraphConfig {
  // Get environment variables
  const apiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const assistantId: string | undefined = process.env.NEXT_PUBLIC_ASSISTANT_ID;

  return {
    apiUrl,
    assistantId,
  };
}
