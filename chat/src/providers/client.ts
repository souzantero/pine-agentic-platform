import { Client } from "@langchain/langgraph-sdk";

export function createClient(
  apiUrl: string,
  bearerToken?: string
) {
  return new Client({
    apiUrl,
    ...(bearerToken && {
      defaultHeaders: {
        Authorization: `Bearer ${bearerToken}`,
      },
    }),
  });
}
