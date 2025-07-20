import { gql } from "graphql-request";

export const PRODUCT_BASIC_FRAGMENT = gql`
  fragment ProductBasic on Product {
    id
    title
    description
    handle
    status
    vendor
    productType
    tags
    createdAt
    updatedAt
    totalInventory
  }
`;

export const PRODUCT_SEO_FRAGMENT = gql`
  fragment ProductSeo on Product {
    seo {
      title
      description
    }
  }
`;

export const PRODUCT_IMAGE_FRAGMENT = gql`
  fragment ProductImage on Image {
    id
    src
    altText
    width
    height
  }
`;

export const PRODUCT_VARIANT_FRAGMENT = gql`
  fragment ProductVariant on ProductVariant {
    id
    title
    price
    sku
    weight
    weightUnit
    inventoryQuantity
    inventoryPolicy
    inventoryManagement
    requiresShipping
    taxable
    barcode
    selectedOptions {
      name
      value
    }
  }
`;

export const PRODUCT_FULL_FRAGMENT = gql`
  ${PRODUCT_BASIC_FRAGMENT}
  ${PRODUCT_SEO_FRAGMENT}
  ${PRODUCT_IMAGE_FRAGMENT}
  ${PRODUCT_VARIANT_FRAGMENT}
  
  fragment ProductFull on Product {
    ...ProductBasic
    ...ProductSeo
    options {
      id
      name
      position
      values
    }
    variants(first: 100) {
      edges {
        node {
          ...ProductVariant
        }
      }
    }
    images(first: 20) {
      edges {
        node {
          ...ProductImage
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