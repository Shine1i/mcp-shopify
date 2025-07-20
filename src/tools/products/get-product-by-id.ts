import { gql } from "graphql-request";
import { z } from "zod";
import { getGraphQLClient } from "../../utils/graphql-client.js";
import { handleExecutionError } from "../../utils/error-handler.js";
import { formatGid, mapEdgesToNodes } from "../../utils/formatters.js";
import { PRODUCT_FULL_FRAGMENT } from "../../graphql/fragments/product.js";

const GetProductByIdInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required")
});

type GetProductByIdInput = z.infer<typeof GetProductByIdInputSchema>;

const GET_PRODUCT_BY_ID_QUERY = gql`
  ${PRODUCT_FULL_FRAGMENT}
  
  query GetProductById($id: ID!) {
    product(id: $id) {
      ...ProductFull
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
      collections(first: 10) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  }
`;

function formatProductDetails(product: any) {
  if (!product) {
    throw new Error("Product not found");
  }

  const variants = mapEdgesToNodes(product.variants.edges);
  const images = mapEdgesToNodes(product.images.edges);
  const metafields = mapEdgesToNodes(product.metafields.edges);
  const collections = mapEdgesToNodes(product.collections.edges);

  return {
    product: {
      id: product.id,
      title: product.title,
      description: product.description,
      descriptionHtml: product.descriptionHtml,
      handle: product.handle,
      status: product.status,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
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
      options: product.options,
      variants: variants.map((v: any) => ({
        id: v.id,
        title: v.title,
        price: v.price,
        sku: v.sku,
        weight: v.weight,
        weightUnit: v.weightUnit,
        inventoryQuantity: v.inventoryQuantity,
        inventoryPolicy: v.inventoryPolicy,
        inventoryManagement: v.inventoryManagement,
        requiresShipping: v.requiresShipping,
        taxable: v.taxable,
        barcode: v.barcode,
        selectedOptions: v.selectedOptions
      })),
      images: images.map((img: any) => ({
        id: img.id,
        src: img.src,
        altText: img.altText,
        width: img.width,
        height: img.height
      })),
      seo: product.seo,
      metafields: metafields.map((mf: any) => ({
        id: mf.id,
        namespace: mf.namespace,
        key: mf.key,
        value: mf.value,
        type: mf.type
      })),
      collections: collections.map((c: any) => ({
        id: c.id,
        title: c.title,
        handle: c.handle
      }))
    }
  };
}

export const getProductById = {
  name: "get-product-by-id",
  description: "Get a specific product by ID with all details",
  schema: GetProductByIdInputSchema,

  execute: async (input: GetProductByIdInput) => {
    try {
      const client = getGraphQLClient();
      const productGid = formatGid("Product", input.productId);
      
      const data = await client.request<any>(GET_PRODUCT_BY_ID_QUERY, {
        id: productGid
      });

      return formatProductDetails(data.product);
    } catch (error) {
      handleExecutionError(error, "fetch product details");
    }
  }
};