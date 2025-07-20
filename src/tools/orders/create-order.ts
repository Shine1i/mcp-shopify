import { gql } from "graphql-request";
import { z } from "zod";
import { getGraphQLClient } from "../../utils/graphql-client.js";
import { handleGraphQLErrors, handleExecutionError } from "../../utils/error-handler.js";
import { formatGid, mapEdgesToNodes } from "../../utils/formatters.js";
import { ORDER_FULL_FRAGMENT } from "../../graphql/fragments/order.js";

const AddressSchema = z.object({
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional()
});

const LineItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive(),
  price: z.string().optional(),
  customAttributes: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional()
});

const CreateOrderInputSchema = z.object({
  customerId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lineItems: z.array(LineItemSchema).min(1, "At least one line item is required"),
  shippingAddress: AddressSchema.optional(),
  billingAddress: AddressSchema.optional(),
  shippingLine: z.object({
    title: z.string(),
    price: z.string(),
    code: z.string().optional()
  }).optional(),
  financialStatus: z.enum(["PENDING", "PAID", "REFUNDED", "VOIDED"]).optional(),
  fulfillmentStatus: z.enum(["UNFULFILLED", "FULFILLED", "PARTIAL"]).optional(),
  sendReceipt: z.boolean().default(false),
  sendFulfillmentReceipt: z.boolean().default(false),
  metafields: z.array(z.object({
    namespace: z.string(),
    key: z.string(),
    value: z.string(),
    type: z.string()
  })).optional()
});

type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

const CREATE_ORDER_MUTATION = gql`
  ${ORDER_FULL_FRAGMENT}
  
  mutation CreateOrder($order: OrderInput!) {
    orderCreate(order: $order) {
      order {
        ...OrderFull
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function formatOrderInput(input: CreateOrderInput) {
  const orderInput: any = {
    lineItems: input.lineItems.map(item => ({
      variantId: formatGid("ProductVariant", item.variantId),
      quantity: item.quantity,
      customAttributes: item.customAttributes
    }))
  };

  if (input.customerId) {
    orderInput.customerId = formatGid("Customer", input.customerId);
  }
  if (input.email) orderInput.email = input.email;
  if (input.phone) orderInput.phone = input.phone;
  if (input.note) orderInput.note = input.note;
  if (input.tags) orderInput.tags = input.tags;
  if (input.shippingAddress) orderInput.shippingAddress = input.shippingAddress;
  if (input.billingAddress) orderInput.billingAddress = input.billingAddress;
  if (input.shippingLine) orderInput.shippingLine = input.shippingLine;
  if (input.financialStatus) orderInput.financialStatus = input.financialStatus;
  if (input.fulfillmentStatus) orderInput.fulfillmentStatus = input.fulfillmentStatus;
  if (input.sendReceipt !== undefined) orderInput.sendReceipt = input.sendReceipt;
  if (input.sendFulfillmentReceipt !== undefined) {
    orderInput.sendFulfillmentReceipt = input.sendFulfillmentReceipt;
  }
  if (input.metafields) orderInput.metafields = input.metafields;

  return orderInput;
}

function formatOrderResponse(order: any) {
  const lineItems = mapEdgesToNodes(order.lineItems.edges);
  const shippingLines = mapEdgesToNodes(order.shippingLines.edges);
  const fulfillments = mapEdgesToNodes(order.fulfillments.edges);
  const metafields = mapEdgesToNodes(order.metafields.edges);

  return {
    order: {
      id: order.id,
      name: order.name,
      email: order.email,
      phone: order.phone,
      note: order.note,
      tags: order.tags,
      displayFinancialStatus: order.displayFinancialStatus,
      displayFulfillmentStatus: order.displayFulfillmentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      processedAt: order.processedAt,
      closedAt: order.closedAt,
      cancelledAt: order.cancelledAt,
      currencyCode: order.currencyCode,
      totalPrice: {
        amount: order.totalPriceSet.shopMoney.amount,
        currencyCode: order.totalPriceSet.shopMoney.currencyCode
      },
      subtotalPrice: {
        amount: order.subtotalPriceSet.shopMoney.amount,
        currencyCode: order.subtotalPriceSet.shopMoney.currencyCode
      },
      totalTax: {
        amount: order.totalTaxSet.shopMoney.amount,
        currencyCode: order.totalTaxSet.shopMoney.currencyCode
      },
      totalShippingPrice: {
        amount: order.totalShippingPriceSet.shopMoney.amount,
        currencyCode: order.totalShippingPriceSet.shopMoney.currencyCode
      },
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      customer: order.customer,
      lineItems: lineItems.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        originalUnitPrice: item.originalUnitPrice,
        discountedUnitPrice: item.discountedUnitPrice,
        discountedTotal: item.discountedTotal,
        variant: item.variant,
        product: item.product
      })),
      shippingLines: shippingLines.map((line: any) => ({
        id: line.id,
        title: line.title,
        price: line.price,
        code: line.code,
        source: line.source
      })),
      fulfillments: fulfillments.map((f: any) => ({
        id: f.id,
        status: f.status,
        createdAt: f.createdAt,
        trackingInfo: f.trackingInfo
      })),
      metafields: metafields.map((mf: any) => ({
        id: mf.id,
        namespace: mf.namespace,
        key: mf.key,
        value: mf.value,
        type: mf.type
      }))
    }
  };
}

export const createOrder = {
  name: "create-order",
  description: "Create a new order in Shopify",
  schema: CreateOrderInputSchema,

  execute: async (input: CreateOrderInput) => {
    try {
      const client = getGraphQLClient();
      const variables = {
        order: formatOrderInput(input)
      };

      const data = await client.request<any>(CREATE_ORDER_MUTATION, variables);
      
      handleGraphQLErrors(data.orderCreate.userErrors, "create order");
      
      return formatOrderResponse(data.orderCreate.order);
    } catch (error) {
      handleExecutionError(error, "create order");
    }
  }
};