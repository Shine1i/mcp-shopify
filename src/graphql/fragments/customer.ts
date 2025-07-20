import { gql } from "graphql-request";

export const CUSTOMER_BASIC_FRAGMENT = gql`
  fragment CustomerBasic on Customer {
    id
    displayName
    email
    firstName
    lastName
    phone
    acceptsMarketing
    state
    numberOfOrders
    createdAt
    updatedAt
  }
`;

export const CUSTOMER_ADDRESS_FRAGMENT = gql`
  fragment CustomerAddress on MailingAddress {
    id
    address1
    address2
    city
    country
    countryCodeV2
    firstName
    lastName
    phone
    province
    provinceCode
    zip
  }
`;

export const CUSTOMER_FULL_FRAGMENT = gql`
  ${CUSTOMER_BASIC_FRAGMENT}
  ${CUSTOMER_ADDRESS_FRAGMENT}
  
  fragment CustomerFull on Customer {
    ...CustomerBasic
    defaultAddress {
      ...CustomerAddress
    }
    addresses(first: 10) {
      edges {
        node {
          ...CustomerAddress
        }
      }
    }
    metafields(first: 20) {
      edges {
        node {
          id
          namespace
          key
          value
          type
        }
      }
    }
  }
`;