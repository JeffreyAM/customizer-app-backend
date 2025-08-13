import { MediaNode, MetafieldWithNamespace, PageInfo, UserError } from "./common";
import { ShopifyProductVariant, ShopifyProductVariantsConnection } from "./variant";

// Product create response
export type ShopifyProductCreateResponse = {
  productCreate: {
    product: {
      media: any;
      id: string;
      title: string;
      options: Array<{
        id: string;
        name: string;
        values: string[];
      }>;
      variants: ShopifyProductVariantsConnection;
      totalVariants: number;
    };
    userErrors: UserError[];
  };
};

// Single product query
export type ShopifyProductResponse = {
  product: {
    id: string;
    title: string;
    description: string;
    vendor: string;
    mediaCount: { count: number };
    media: { nodes: MediaNode[] };
    options: Array<{
      id: string;
      name: string;
      values: string[];
    }>;
    variantsCount: { count: number };
    variants: ShopifyProductVariantsConnection;
    totalVariants: number;
  };
};

// Product list query
export type ShopifyProductsResponse = {
  products: {
    nodes: Array<{
      id: string;
      title: string;
      metafields: { nodes: MetafieldWithNamespace[] };
      variantsCount: { count: number };
      variants: { nodes: ShopifyProductVariant[] };
      mediaCount: { count: number };
      media: { nodes: MediaNode[] };
    }>;
  };
};
