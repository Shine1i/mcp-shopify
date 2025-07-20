import { gql } from "graphql-request";
import { z } from "zod";
import { getGraphQLClient } from "../../utils/graphql-client.js";
import { handleGraphQLErrors, handleExecutionError } from "../../utils/error-handler.js";
import { CUSTOMER_FULL_FRAGMENT } from "../../graphql/fragments/customer.js";

const CreateCustomerInputSchema = z.object({
  email: z.string().email("Email must be valid"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  acceptsMarketing: z.boolean().optional(),
  addresses: z
    .array(
      z.object({
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
        zip: z.string().optional(),
        phone: z.string().optional()
      })
    )
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
  tags: z.array(z.string()).optional()
});

type CreateCustomerInput = z.infer<typeof CreateCustomerInputSchema>;

const CREATE_CUSTOMER_MUTATION = gql`
  ${CUSTOMER_FULL_FRAGMENT}
  
  mutation CreateCustomer($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        ...CustomerFull
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const createCustomer = {
  name: "create-customer",
  description: "Create a new customer in Shopify",
  schema: CreateCustomerInputSchema,

  execute: async (input: CreateCustomerInput) => {
    try {
      const client = getGraphQLClient();
      
      const customerInput: any = {
        email: input.email
      };

      if (input.firstName) customerInput.firstName = input.firstName;
      if (input.lastName) customerInput.lastName = input.lastName;
      if (input.phone) customerInput.phone = input.phone;
      if (input.acceptsMarketing !== undefined) {
        customerInput.acceptsMarketing = input.acceptsMarketing;
      }
      if (input.addresses) customerInput.addresses = input.addresses;
      if (input.metafields) customerInput.metafields = input.metafields;
      if (input.tags) customerInput.tags = input.tags;

      const data = await client.request<any>(CREATE_CUSTOMER_MUTATION, {
        input: customerInput
      });

      handleGraphQLErrors(data.customerCreate.userErrors, "create customer");

      const customer = data.customerCreate.customer;
      return {
        customer: {
          id: customer.id,
          displayName: customer.displayName,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          acceptsMarketing: customer.acceptsMarketing,
          state: customer.state,
          numberOfOrders: customer.numberOfOrders,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          defaultAddress: customer.defaultAddress,
          addresses: customer.addresses?.edges?.map((e: any) => e.node) || [],
          metafields: customer.metafields?.edges?.map((e: any) => e.node) || []
        }
      };
    } catch (error) {
      handleExecutionError(error, "create customer");
    }
  }
};