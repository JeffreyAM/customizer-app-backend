import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Template = {
  id: string;
  template_id: string;
  product_title: string;
  variant_options: any;
  image_url?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
};
