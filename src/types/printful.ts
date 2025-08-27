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

export type PrintfulProductCatalogResponse = {
  data: {
  id: number;
  type: string;
  main_category_id: number;
  name: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  is_discontinued: boolean;
  description: string;
  sizes: string[];
  colors: Array<{
    name: string;
    value: string;
  }>;
  techniques: Array<{
    key: string;
    display_name: string;
    is_default: boolean;
  }>;
  placements: Array<{
    placement: string;
    technique: string;
    layers: Array<{
      type: string;
      layer_options: Array<{
        name: string;
        techniques: string[];
        type: string;
        values: Record<string, string>;
      }>;
    }>;
    placement_options: any[]; // Still undefined in structure
    conflicting_placements: string[];
  }>;
  product_options: Array<{
    name: string;
    techniques: string[];
    type: string;
    values: string[];
  }>;
  _links: {
    self: { href: string };
    variants: { href: string };
    categories: { href: string };
    product_prices: { href: string };
    product_sizes: { href: string };
    product_images: { href: string };
    product_availability: { href: string };
  };
}
};
export interface PrintfulProductCatalogVariant {
  id: number;
  catalog_product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  color_code2: string;
  image: string;
  _links: {
    self: { href: string };
    product_details: { href: string };
    product_variants: { href: string };
    variant_prices: { href: string };
    variant_images: { href: string };
    variant_availability: { href: string };
  };
  placement_dimensions: Array<{
    placement: string;
    height: number;
    width: number;
    orientation: string;
  }>;
  selling_regions: Array<{
    name: string;
    availability: string;
    placement_option_availability: any[]; // Or a more specific type if known
  }>;
  techniques: Array<{
    technique_key: string;
    technique_display_name: string;
    price: string;
    discounted_price: string;
  }>;
}


