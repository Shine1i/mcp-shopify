import { gql } from "graphql-request";
import { z } from "zod";
import { getGraphQLClient } from "../../utils/graphql-client.js";
import { handleGraphQLErrors, handleExecutionError } from "../../utils/error-handler.js";
import { formatGid } from "../../utils/formatters.js";

const AdjustInventoryInputSchema = z.object({
  inventoryItemId: z.string(),
  locationId: z.string(),
  availableDelta: z.number().int(),
  reason: z.string().optional()
});

type AdjustInventoryInput = z.infer<typeof AdjustInventoryInputSchema>;

const ADJUST_INVENTORY_MUTATION = gql`
  mutation AdjustInventory($input: InventoryAdjustQuantityInput!) {
    inventoryAdjustQuantity(input: $input) {
      inventoryLevel {
        id
        quantities(names: ["available", "incoming", "committed", "on_hand"]) {
          name
          quantity
        }
        item {
          id
          sku
          tracked
        }
        location {
          id
          name
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const adjustInventory = {
  name: "adjust-inventory",
  description: "Adjust inventory quantity at a specific location",
  schema: AdjustInventoryInputSchema,

  execute: async (input: AdjustInventoryInput) => {
    try {
      const client = getGraphQLClient();
      
      const variables = {
        input: {
          inventoryItemId: formatGid("InventoryItem", input.inventoryItemId),
          locationId: formatGid("Location", input.locationId),
          availableDelta: input.availableDelta,
          reason: input.reason
        }
      };

      const data = await client.request<any>(ADJUST_INVENTORY_MUTATION, variables);
      
      handleGraphQLErrors(data.inventoryAdjustQuantity.userErrors, "adjust inventory");

      const level = data.inventoryAdjustQuantity.inventoryLevel;
      const quantities = level.quantities.reduce((acc: any, q: any) => {
        acc[q.name] = q.quantity;
        return acc;
      }, {});

      return {
        inventoryLevel: {
          id: level.id,
          ...quantities,
          item: {
            id: level.item.id,
            sku: level.item.sku,
            tracked: level.item.tracked
          },
          location: {
            id: level.location.id,
            name: level.location.name
          }
        }
      };
    } catch (error) {
      handleExecutionError(error, "adjust inventory");
    }
  }
};