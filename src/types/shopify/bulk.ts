import { ShopifyProductVariant } from "./variant";
import { UserError } from "./common";

export type ShopifyProductVariantsBulkCreateResponse = {
  productVariantsBulkCreate: {
    productVariants: ShopifyProductVariant[];
    userErrors: UserError[];
  };
};
