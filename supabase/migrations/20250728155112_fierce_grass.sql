/*
  # Create templates table for Printful EDM integration

  1. New Tables
    - `templates`
      - `id` (uuid, primary key)
      - `template_id` (text, unique) - Printful template ID
      - `product_title` (text) - Product title from Printful
      - `variant_options` (jsonb) - Variant options as JSON
      - `image_url` (text) - Preview image URL
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `templates` table
    - Add policy for authenticated users to read/write their own templates
    - Add policy for authenticated users to read all templates (for dashboard)
*/

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text UNIQUE NOT NULL,
  product_title text NOT NULL,
  variant_options jsonb DEFAULT '{}',
  image_url text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own templates
CREATE POLICY "Users can manage own templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to read all templates (for dashboard viewing)
CREATE POLICY "Users can read all templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_templates_template_id ON templates(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);