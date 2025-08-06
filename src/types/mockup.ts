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
