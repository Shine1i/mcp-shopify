import { gql } from "graphql-request";
import { z } from "zod";
import { getGraphQLClient } from "../../utils/graphql-client.js";
import { handleExecutionError } from "../../utils/error-handler.js";
import { mapEdgesToNodes } from "../../utils/formatters.js";
import { CUSTOMER_BASIC_FRAGMENT } from "../../graphql/fragments/customer.js";

const GetCustomersInputSchema = z.object({
  searchQuery: z.string().optional(),
  limit: z.number().default(10)
});

type GetCustomersInput = z.infer<typeof GetCustomersInputSchema>;

const GET_CUSTOMERS_QUERY = gql`
  ${CUSTOMER_BASIC_FRAGMENT}
  
  query GetCustomers($first: Int!, $query: String) {
    customers(first: $first, query: $query) {
      edges {
        node {
          ...CustomerBasic
          defaultAddress {
            id
            address1
            address2
            city
            country
            province
            zip
          }
        }
      }
    }
  }
`;

export const getCustomers = {
  name: "get-customers",
  description: "Get all customers or search by email",
  schema: GetCustomersInputSchema,

  execute: async (input: GetCustomersInput) => {
    try {
      const { searchQuery, limit } = input;
      const client = getGraphQLClient();

      const variables = {
        first: limit,
        query: searchQuery || undefined
      };

      const data = await client.request<any>(GET_CUSTOMERS_QUERY, variables);

      const customers = data.customers.edges.map((edge: any) => {
        const customer = edge.node;
        return {
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
          defaultAddress: customer.defaultAddress
        };
      });

      return { customers };
    } catch (error) {
      handleExecutionError(error, "fetch customers");
    }
  }
};