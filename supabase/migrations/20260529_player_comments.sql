-- Add comments for player profile pages.

CREATE TABLE IF NOT EXISTS public.player_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id),
  content     text NOT NULL CHECK (char_length(content) <= 500),
  is_hidden   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.player_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_comments_public_read" ON public.player_comments;
CREATE POLICY "player_comments_public_read" ON public.player_comments
  FOR SELECT USING (is_hidden = false);

DROP POLICY IF EXISTS "player_comments_insert_authenticated" ON public.player_comments;
CREATE POLICY "player_comments_insert_authenticated" ON public.player_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
