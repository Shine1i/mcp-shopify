import { gql } from "graphql-request";

export const ORDER_LINE_ITEM_FRAGMENT = gql`
  fragment OrderLineItem on LineItem {
    id
    title
    quantity
    price
    originalUnitPrice
    discountedUnitPrice
    discountedTotal
    variant {
      id
      title
      sku
    }
    product {
      id
      title
    }
  }
`;

export const ORDER_ADDRESS_FRAGMENT = gql`
  fragment OrderAddress on MailingAddress {
    address1
    address2
    city
    province
    provinceCode
    country
    countryCodeV2
    zip
    phone
    firstName
    lastName
    company
  }
`;

export const ORDER_BASIC_FRAGMENT = gql`
  fragment OrderBasic on Order {
    id
    name
    displayFinancialStatus
    displayFulfillmentStatus
    createdAt
    updatedAt
    processedAt
    closedAt
    cancelledAt
    currencyCode
    totalPriceSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    subtotalPriceSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    totalTaxSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    totalShippingPriceSet {
      shopMoney {
        amount
        currencyCode
      }
    }
  }
`;

export const ORDER_FULL_FRAGMENT = gql`
  ${ORDER_BASIC_FRAGMENT}
  ${ORDER_LINE_ITEM_FRAGMENT}
  ${ORDER_ADDRESS_FRAGMENT}
  
  fragment OrderFull on Order {
    ...OrderBasic
    email
    phone
    note
    tags
    billingAddress {
      ...OrderAddress
    }
    shippingAddress {
      ...OrderAddress
    }
    customer {
      id
      email
      firstName
      lastName
      displayName
    }
    lineItems(first: 250) {
      edges {
        node {
          ...OrderLineItem
        }
      }
    }
    shippingLines(first: 10) {
      edges {
        node {
          id
          title
          price
          code
          source
        }
      }
    }
    fulfillments(first: 20) {
      edges {
        node {
          id
          status
          createdAt
          trackingInfo {
            number
            url
            company
          }
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