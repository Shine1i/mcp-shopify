export interface Money {
  amount: string;
  currencyCode: string;
}

export interface SEO {
  title?: string;
  description?: string;
}

export interface Image {
  id?: string;
  src: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface Metafield {
  id?: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface UserError {
  field: string;
  message: string;
}

export interface Edge<T> {
  node: T;
  cursor?: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo?: PageInfo;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";
export type WeightUnit = "KILOGRAMS" | "GRAMS" | "POUNDS" | "OUNCES";
export type InventoryPolicy = "DENY" | "CONTINUE";
export type InventoryManagement = "SHOPIFY" | "NOT_MANAGED";

export interface ProductOption {
  id?: string;
  name: string;
  position?: number;
  values: string[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id?: string;
  title?: string;
  price: string;
  sku?: string;
  weight?: number;
  weightUnit?: WeightUnit;
  inventoryQuantity?: number;
  inventoryPolicy?: InventoryPolicy;
  inventoryManagement?: InventoryManagement;
  requiresShipping?: boolean;
  taxable?: boolean;
  barcode?: string;
  selectedOptions?: SelectedOption[];
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  handle: string;
  status: ProductStatus;
  vendor?: string;
  productType?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  totalInventory?: number;
  options?: ProductOption[];
  variants?: ProductVariant[];
  images?: Image[];
  seo?: SEO;
  metafields?: Metafield[];
}