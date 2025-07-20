import { gql } from "graphql-request";
import { z } from "zod";
import { getGraphQLClient } from "../../utils/graphql-client.js";
import { handleGraphQLErrors, handleExecutionError } from "../../utils/error-handler.js";
import { formatGid, mapEdgesToNodes } from "../../utils/formatters.js";
import { PRODUCT_FULL_FRAGMENT } from "../../graphql/fragments/product.js";
import { WeightUnit, InventoryPolicy, InventoryManagement, ProductStatus } from "../../types/shopify.js";

const CreateProductInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  descriptionHtml: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"] as const).default("ACTIVE"),
  options: z
    .array(
      z.object({
        name: z.string().min(1, "Option name is required"),
        values: z.array(z.string()).min(1, "At least one option value is required")
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        options: z.array(z.string()),
        price: z.string(),
        sku: z.string().optional(),
        weight: z.number().optional(),
        weightUnit: z.enum(["KILOGRAMS", "GRAMS", "POUNDS", "OUNCES"] as const).optional(),
        inventoryQuantity: z.number().int().optional(),
        inventoryPolicy: z.enum(["DENY", "CONTINUE"] as const).optional(),
        inventoryManagement: z.enum(["SHOPIFY", "NOT_MANAGED"] as const).optional(),
        requiresShipping: z.boolean().optional(),
        taxable: z.boolean().optional(),
        barcode: z.string().optional()
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        src: z.string().url("Image source must be a valid URL"),
        altText: z.string().optional()
      })
    )
    .optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional()
    })
    .optional(),
  metafields: z
    .array(
      z.object({
        namespace: z.string(),
        key: z.string(),
        value: z.string(),
        type: z.string()
      })
    )
    .optional(),
  collectionsToJoin: z.array(z.string()).optional(),
  giftCard: z.boolean().optional(),
  taxCode: z.string().optional()
});

type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

const CREATE_PRODUCT_MUTATION = gql`
  ${PRODUCT_FULL_FRAGMENT}
  
  mutation CreateProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        ...ProductFull
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function formatProductInput(input: CreateProductInput) {
  const productInput: any = {
    title: input.title,
    status: input.status
  };

  if (input.descriptionHtml) productInput.descriptionHtml = input.descriptionHtml;
  if (input.vendor) productInput.vendor = input.vendor;
  if (input.productType) productInput.productType = input.productType;
  if (input.tags?.length) productInput.tags = input.tags;
  if (input.options?.length) productInput.options = input.options;
  if (input.seo) productInput.seo = input.seo;
  if (input.giftCard !== undefined) productInput.giftCard = input.giftCard;

  const variants = input.variants?.map(variant => ({
    options: variant.options,
    price: variant.price,
    sku: variant.sku,
    weight: variant.weight,
    weightUnit: variant.weightUnit,
    inventoryQuantities: variant.inventoryQuantity !== undefined ? {
      availableQuantity: variant.inventoryQuantity,
      locationId: formatGid("Location", "1")
    } : undefined,
    inventoryPolicy: variant.inventoryPolicy,
    inventoryManagement: variant.inventoryManagement,
    requiresShipping: variant.requiresShipping,
    taxable: variant.taxable,
    barcode: variant.barcode
  }));

  const images = input.images?.map(image => ({
    src: image.src,
    altText: image.altText
  }));

  const metafields = input.metafields?.map(metafield => ({
    namespace: metafield.namespace,
    key: metafield.key,
    value: metafield.value,
    type: metafield.type
  }));

  const collectionsToJoin = input.collectionsToJoin?.map(id => formatGid("Collection", id));

  return {
    ...productInput,
    variants,
    images,
    metafields,
    collectionsToJoin
  };
}

function formatProductResponse(product: any) {
  const variants = mapEdgesToNodes(product.variants.edges);
  const images = mapEdgesToNodes(product.images.edges);
  const metafields = mapEdgesToNodes(product.metafields.edges);

  return {
    product: {
      id: product.id,
      title: product.title,
      descriptionHtml: product.descriptionHtml,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      status: product.status,
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
      giftCard: product.giftCard,
      handle: product.handle,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }
  };
}

export const createProduct = {
  name: "create-product",
  description: "Create a new product in Shopify",
  schema: CreateProductInputSchema,

  execute: async (input: CreateProductInput) => {
    try {
      const client = getGraphQLClient();
      const variables = {
        input: formatProductInput(input)
      };

      const data = await client.request<any>(CREATE_PRODUCT_MUTATION, variables);
      
      handleGraphQLErrors(data.productCreate.userErrors, "create product");
      
      return formatProductResponse(data.productCreate.product);
    } catch (error) {
      handleExecutionError(error, "create product");
    }
  }
};