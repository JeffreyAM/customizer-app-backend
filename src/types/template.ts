export interface Template {
  id: string;
  template_id: string;
  product_title: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  variant_options?: Record<string, any>;
}
