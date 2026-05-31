-- Expand poll types and add overall rating responses/comments.

ALTER TABLE public.poll_options
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE IF NOT EXISTS public.rating_votes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id          uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES public.users(id),
  target_player_id uuid NOT NULL REFERENCES public.players(id),
  score            int NOT NULL CHECK (score >= 0 AND score <= 5),
  comment          text CHECK (comment IS NULL OR char_length(comment) <= 500),
  created_at       timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id, target_player_id)
);

CREATE TABLE IF NOT EXISTS public.rating_vote_likes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_vote_id uuid NOT NULL REFERENCES public.rating_votes(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.users(id),
  created_at     timestamptz DEFAULT now(),
  UNIQUE(rating_vote_id, user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rating_votes_public_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.rating_votes
      ADD CONSTRAINT rating_votes_public_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.public_profiles(id)
      ON DELETE CASCADE NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.rating_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_vote_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rating_votes: public read"
  ON public.rating_votes FOR SELECT
  USING (true);

CREATE POLICY "rating_votes: insert authenticated"
  ON public.rating_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rating_vote_likes: public read"
  ON public.rating_vote_likes FOR SELECT
  USING (true);

CREATE POLICY "rating_vote_likes: insert authenticated"
  ON public.rating_vote_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rating_vote_likes: delete own"
  ON public.rating_vote_likes FOR DELETE
  USING (auth.uid() = user_id);
