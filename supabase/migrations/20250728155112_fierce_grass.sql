-- CREATE TABLE public.customizations (
--   id uuid NOT NULL DEFAULT uuid_generate_v4(),
--   color text NOT NULL,
--   message text NOT NULL,
--   font text NOT NULL,
--   shopify_product_id text NOT NULL,
--   created_at timestamp with time zone DEFAULT now(),
--   CONSTRAINT customizations_pkey PRIMARY KEY (id)
-- );
-- CREATE TABLE public.templates (
--   id uuid NOT NULL DEFAULT gen_random_uuid(),
--   template_id text NOT NULL UNIQUE,
--   product_title text NOT NULL,
--   variant_options jsonb DEFAULT '{}'::jsonb,
--   image_url text,
--   user_id uuid,
--   created_at timestamp with time zone DEFAULT now(),
--   updated_at timestamp with time zone DEFAULT now(),
--   CONSTRAINT templates_pkey PRIMARY KEY (id),
--   CONSTRAINT templates_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.users(id)
-- );
-- CREATE TABLE public.users (
--   id uuid NOT NULL DEFAULT gen_random_uuid(),
--   name text NOT NULL,
--   email text NOT NULL UNIQUE,
--   created_at timestamp with time zone DEFAULT now(),
--   updated_at timestamp with time zone DEFAULT now(),
--   CONSTRAINT users_pkey PRIMARY KEY (id)
-- );

CREATE TABLE mockup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_key text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);


