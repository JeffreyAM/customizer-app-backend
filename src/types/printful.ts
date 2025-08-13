export type PrintfulProductResponse = {
  code: number;
  result: {
    product: {
      id: string;
      main_category_id: number;
      type: string;
      description: string;
      type_name: string;
      title: string;
      brand: string;
      model: string;
      image: string;
      variant_count: number;
      currency: string;
      options: Array<{
        id: string;
        title: string;
        type: string;
        values: Record<string, string>;
        additional_price: number | null;
        additional_price_breakdown: Array<{}>;
      }>;
      dimensions: any;
      is_discontinued: boolean;
      avg_fulfillment_time: number;
      techniques: Array<{
        key: string;
        display_name: string;
        is_default: boolean;
      }>;
      files: Array<{
        id: string;
        type: string;
        title: string;
        additional_price: number | null;
        options: Array<{
          id: string;
          type: string;
          title: string;
          additional_price: number | null;
        }>;
      }>;
      origin_country: string;
    };
    variants: Array<{
      id: number;
      product_id: number;
      name: string;
      size: string | null;
      color: string | null;
      color_code: string | null;
      color_code2: string | null;
      image: string | null;
      price: string;
      in_stock: boolean;
      availability_regions: Record<string, string>;
      availability_status: Array<{
        region: string;
        status: string;
      }>;
      material: Array<{
        name: string;
        percentage: number;
      }>;
    }>;
  };
};


export type PrintfulProductSyncResponse = {
  code: number;
  result: {
    id: number;
    external_id: string;
    name: string;
    variants: number;
    synced: number;
    thumbnail_url: string;
    is_ignored: boolean;
  };
};

export interface PrintfulProductSync {
  id: string;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
  edmTemplateId?: string;
  printfulId?: string;
}
