ALTER TABLE public.poll_options
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.poll_options
  ADD COLUMN IF NOT EXISTS image_url text;
