import { Client } from "@langchain/langgraph-sdk";

export function createClient(
  apiUrl: string,
  apiKey: string | undefined,
  bearerToken?: string
) {
  return new Client({
    apiKey,
    apiUrl,
    ...(bearerToken && {
      defaultHeaders: {
        Authorization: `Bearer ${bearerToken}`,
      },
    }),
  });
}
