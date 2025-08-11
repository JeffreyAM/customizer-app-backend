export type ShopifyProductVariant = {
  id: string;
  title: string;
  price: string;
  barcode: string | null;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
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
export type ShopifyProductVariantEdge = {
  node: ShopifyProductVariant;
};
export type ShopifyProductVariantsConnection = {
  edges: ShopifyProductVariantEdge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
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
