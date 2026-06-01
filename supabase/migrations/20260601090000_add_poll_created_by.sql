ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS polls_created_by_created_at_idx
  ON public.polls(created_by, created_at DESC);
