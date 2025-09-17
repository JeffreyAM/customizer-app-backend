import { SelectedOption, Metafield } from "./common";

export type ShopifyProductVariant = {
  id: string;
  title: string;
  price: string;
  barcode: string | null;
  selectedOptions: SelectedOption[];
  sku: string | null;
  metafields: {
    nodes: Metafield[];
  };
  inventoryItem:{
    id: string
  };
};

export type ShopifyProductVariantsConnection = {
  nodes: ShopifyProductVariant[];
  pageInfo: import("./common").PageInfo;
};
