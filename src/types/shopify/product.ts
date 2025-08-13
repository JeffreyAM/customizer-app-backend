import { MediaNode, MetafieldWithNamespace, PageInfo, UserError } from "./common";
import { ShopifyProductVariant, ShopifyProductVariantsConnection } from "./variant";

/**
 * Basic product option type
 */
export type ShopifyProductOption = {
  id: string;
  name: string;
  values: string[];
};

/**
 * Minimal product type (no counts, just main fields)
 */
export type ShopifyProductBase = {
  id: string;
  title: string;
  media: { nodes: MediaNode[] };
  options: ShopifyProductOption[];
};

/**
 * Product type with description/vendor and full variants
 */
export type ShopifyProductDetailed = ShopifyProductBase & {
  description: string;
  vendor: string;
  variants: ShopifyProductVariant[] | ShopifyProductVariantsConnection;
};

/**
 * Product type with count fields
 */
export type ShopifyProductWithCounts = ShopifyProductDetailed & {
  mediaCount: { count: number };
  variantsCount: { count: number };
  totalVariants: number;
};

/**
 * Response type for creating a product
 */
export type ShopifyProductCreateResponse = {
  productCreate: {
    product: Omit<ShopifyProductBase, "variants"> & {
      variants: ShopifyProductVariantsConnection;
      totalVariants: number;
    };
    userErrors: UserError[];
  };
};

/**
 * Response type for querying a single product
 */
export type ShopifyProductResponse = {
  product: ShopifyProductWithCounts & {
    variants: ShopifyProductVariantsConnection;
  };
};

/**
 * Response type for querying multiple products (product list)
 */
export type ShopifyProductsResponse = {
  products: {
    nodes: Array<
      ShopifyProductBase & {
        metafields: { nodes: MetafieldWithNamespace[] };
        variantsCount: { count: number };
        variants: { nodes: ShopifyProductVariant[] };
        mediaCount: { count: number };
      }
    >;
  };
};
