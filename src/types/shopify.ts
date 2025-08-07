type ShopifyProductCreateResponse = {
  body: {
    data?: {
      productCreate: {
        product: {
          id: string;
          title: string;
          status: string;
        };
        userErrors: Array<{
          field: string[];
          message: string;
        }>;
      };
    };
  };
  error?: string | null;
  details?: string | null;
};
