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

-- create table public.mockup_tasks (
--   id uuid not null default gen_random_uuid (),
--   task_key text not null,
--   template_id uuid null,
--   created_at timestamp with time zone null default now(),
--   status public.Mockup Task Status null default 'pending'::"Mockup Task Status",
--   completed_at timestamp with time zone null,
--   constraint mockup_tasks_pkey primary key (id),
--   constraint mockup_tasks_template_id_fkey foreign KEY (template_id) references templates (id)
-- ) TABLESPACE pg_default;

-- ALTER TABLE public.users ADD COLUMN shopify_customer_id TEXT;

-- ALTER TABLE public.templates
-- DROP CONSTRAINT templates_user_id_fkey1;

-- ALTER TABLE public.templates
-- ADD CONSTRAINT templates_user_id_fkey1
-- FOREIGN KEY (user_id)
-- REFERENCES users(id)
-- ON DELETE CASCADE;

-- ALTER TABLE public.mockup_tasks
-- DROP CONSTRAINT mockup_tasks_template_id_fkey;

-- ALTER TABLE public.mockup_tasks
-- ADD CONSTRAINT mockup_tasks_template_id_fkey
-- FOREIGN KEY (template_id)
-- REFERENCES templates(id)
-- ON DELETE CASCADE;

-- ALTER TABLE public.users
-- DROP CONSTRAINT users_email_key;

