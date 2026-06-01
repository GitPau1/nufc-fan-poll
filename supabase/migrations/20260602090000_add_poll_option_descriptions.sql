ALTER TABLE public.poll_options
  ADD COLUMN IF NOT EXISTS description text;
