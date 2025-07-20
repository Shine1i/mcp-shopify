import { gql } from "graphql-request";
import { z } from "zod";
import { getGraphQLClient } from "../../utils/graphql-client.js";
import { handleExecutionError } from "../../utils/error-handler.js";
import { mapEdgesToNodes } from "../../utils/formatters.js";

const GetProductsInputSchema = z.object({
  searchTitle: z.string().optional(),
  limit: z.number().default(10)
});

type GetProductsInput = z.infer<typeof GetProductsInputSchema>;

const GET_PRODUCTS_QUERY = gql`
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          description
          handle
          status
          createdAt
          updatedAt
          totalInventory
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 5) {
            edges {
              node {
                id
                title
                price
                inventoryQuantity
                sku
              }
            }
          }
        }
      }
    }
  }
`;

export const getProducts = {
  name: "get-products",
  description: "Get all products or search by title",
  schema: GetProductsInputSchema,

  execute: async (input: GetProductsInput) => {
    try {
      const { searchTitle, limit } = input;
      const client = getGraphQLClient();

      const variables = {
        first: limit,
        query: searchTitle ? `title:*${searchTitle}*` : undefined
      };

      const data = await client.request<any>(GET_PRODUCTS_QUERY, variables);

      const products = data.products.edges.map((edge: any) => {
        const product = edge.node;
        const variants = mapEdgesToNodes(product.variants.edges);
        const imageUrl = product.images.edges.length > 0
          ? product.images.edges[0].node.url
          : null;

        return {
          id: product.id,
          title: product.title,
          description: product.description,
          handle: product.handle,
          status: product.status,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          totalInventory: product.totalInventory,
          priceRange: {
            minPrice: {
              amount: product.priceRangeV2.minVariantPrice.amount,
              currencyCode: product.priceRangeV2.minVariantPrice.currencyCode
            },
            maxPrice: {
              amount: product.priceRangeV2.maxVariantPrice.amount,
              currencyCode: product.priceRangeV2.maxVariantPrice.currencyCode
            }
          },
          imageUrl,
          variants: variants.map((v: any) => ({
            id: v.id,
            title: v.title,
            price: v.price,
            inventoryQuantity: v.inventoryQuantity,
            sku: v.sku
          }))
        };
      });

      return { products };
    } catch (error) {
      handleExecutionError(error, "fetch products");
    }
  }
};