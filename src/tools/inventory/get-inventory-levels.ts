import { gql } from "graphql-request";
import { z } from "zod";
import { getGraphQLClient } from "../../utils/graphql-client.js";
import { handleExecutionError } from "../../utils/error-handler.js";
import { formatGid } from "../../utils/formatters.js";

const GetInventoryLevelsInputSchema = z.object({
  locationId: z.string().optional(),
  productId: z.string().optional(),
  limit: z.number().default(10)
});

type GetInventoryLevelsInput = z.infer<typeof GetInventoryLevelsInputSchema>;

const GET_INVENTORY_LEVELS_QUERY = gql`
  query GetInventoryLevels($first: Int!, $query: String) {
    inventoryLevels(first: $first, query: $query) {
      edges {
        node {
          id
          quantities(names: ["available", "incoming", "committed", "on_hand"]) {
            name
            quantity
          }
          item {
            id
            sku
            tracked
            variant {
              id
              title
              product {
                id
                title
              }
            }
          }
          location {
            id
            name
          }
        }
      }
    }
  }
`;

export const getInventoryLevels = {
  name: "get-inventory-levels",
  description: "Get inventory levels, optionally filtered by location or product",
  schema: GetInventoryLevelsInputSchema,

  execute: async (input: GetInventoryLevelsInput) => {
    try {
      const { locationId, productId, limit } = input;
      const client = getGraphQLClient();

      let query = "";
      if (locationId) {
        query = `location_id:${formatGid("Location", locationId)}`;
      } else if (productId) {
        query = `product_id:${formatGid("Product", productId)}`;
      }

      const variables = {
        first: limit,
        query: query || undefined
      };

      const data = await client.request<any>(GET_INVENTORY_LEVELS_QUERY, variables);

      const levels = data.inventoryLevels.edges.map((edge: any) => {
        const level = edge.node;
        const quantities = level.quantities.reduce((acc: any, q: any) => {
          acc[q.name] = q.quantity;
          return acc;
        }, {});

        return {
          id: level.id,
          ...quantities,
          item: {
            id: level.item.id,
            sku: level.item.sku,
            tracked: level.item.tracked,
            variant: level.item.variant ? {
              id: level.item.variant.id,
              title: level.item.variant.title,
              product: {
                id: level.item.variant.product.id,
                title: level.item.variant.product.title
              }
            } : null
          },
          location: {
            id: level.location.id,
            name: level.location.name
          }
        };
      });

      return { inventoryLevels: levels };
    } catch (error) {
      handleExecutionError(error, "fetch inventory levels");
    }
  }
};