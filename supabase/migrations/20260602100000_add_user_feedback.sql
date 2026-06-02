CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  content text NOT NULL CHECK (char_length(content) <= 500),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_feedback_created_at_idx
  ON public.user_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS user_feedback_user_id_created_at_idx
  ON public.user_feedback(user_id, created_at DESC);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_feedback: insert own" ON public.user_feedback;
CREATE POLICY "user_feedback: insert own"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);
