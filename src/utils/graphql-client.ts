import { GraphQLClient } from "graphql-request";

let shopifyClient: GraphQLClient | null = null;

export function initializeGraphQLClient(domain: string, accessToken: string): void {
  shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/2024-07/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    }
  );
}

export function getGraphQLClient(): GraphQLClient {
  if (!shopifyClient) {
    throw new Error("GraphQL client not initialized. Call initializeGraphQLClient first.");
  }
  return shopifyClient;
}