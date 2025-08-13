export type ShopifyProductVariant = {
  id: string;
  title: string;
  price: string;
  barcode: string | null;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  sku: string | null;
  metafields: {
    nodes: Array<{
      id: string;
      key: string;
      value: string;
    }>;
  };
};

export type ShopifyProductVariantsBulkCreateResponse = {
  productVariantsBulkCreate: {
    productVariants: ShopifyProductVariant[];
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
};

export type ShopifyProductVariantsConnection = {
  nodes: ShopifyProductVariant[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor: string | null;
  };
};
export type ShopifyProductCreateResponse = {
  productCreate: {
    product: {
      media: any;
      id: string;
      title: string;
      options: Array<{
        id: string;
        name: string;
        values: Array<string>;
      }>;
      variants: ShopifyProductVariantsConnection;
      totalVariants: number;
    };
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
};

// response for getting shopify product
export type ShopifyProductResponse = {
  product: {
    id: string;
    title: string;
    description: string;
    vendor: string;
    mediaCount: {
      count: number;
    };
    media: {
      nodes: Array<{
        id: string;
        alt: string;
        preview: {
          image: {
            id: string;
            url: string;
          };
        };
      }>;
    };
    options: Array<{
      id: string;
      name: string;
      values: Array<string>;
    }>;
    variantsCount: {
      count: number;
    };
    variants: ShopifyProductVariantsConnection;
    totalVariants: number;
  };
};

export type ShopifyProductsResponse = {
  products: {
    nodes: Array<{
      id: string;
      title: string;
      metafields: {
        nodes: Array<{
          namespace: string;
          key: string;
          value: string;
        }>;
      };
      variantsCount: {
        count: number;
      };
      variants: {
        nodes: Array<{
          id: string;
          title: string;
          price: string;
          barcode: string | null;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
          sku: string | null;
          metafields: {
            nodes: Array<{
              id: string;
              key: string;
              value: string;
            }>;
          };
        }>;
      };
      mediaCount: {
        count: number;
      };
      media: {
        nodes: Array<{
          id: string;
          alt: string;
          preview: {
            image: {
              id: string;
              url: string;
            };
          };
        }>;
      };
    }>;
  };
};
