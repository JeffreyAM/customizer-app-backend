export interface MockupData {
  id: string;
  task_key: string;
  created_at: string;
  templates: {
    id: string;
    product_title: string;
    image_url: string;
  }[];
}
export interface MockupVariantsImages {
  variants: string;
  url: string;
}

export interface MockupExtra {
  url: string;
  title: string;
  option: string;
  option_group: string;
  generator_mockup_id: number;
}

export interface Mockup {
  extra: MockupExtra[];
  placement: string;
  mockup_url: string;
  variant_ids: number[];
  generator_mockup_id: number;
}

export interface MockupsResponse {
  mockups: Mockup[];
}

