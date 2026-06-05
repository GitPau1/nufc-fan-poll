-- =====================================================
-- Short news posts
-- =====================================================

CREATE TABLE public.posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id),
  type         text NOT NULL CHECK (type IN ('free', 'info', 'official')),
  content      text NOT NULL CHECK (char_length(content) <= 300),
  url          text,
  embed_kind   text NOT NULL DEFAULT 'none' CHECK (embed_kind IN ('none', 'link', 'x', 'youtube')),
  embed_title  text,
  embed_domain text,
  is_hidden    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (type <> 'official' OR url IS NOT NULL)
);

ALTER TABLE public.posts
  ADD CONSTRAINT posts_public_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.public_profiles(id)
  ON DELETE CASCADE NOT VALID;

CREATE TABLE public.post_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users(id),
  reaction_type text NOT NULL CHECK (reaction_type IN ('expecting', 'shocked', 'angry', 'sad', 'curious')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX posts_visible_created_at_idx ON public.posts(created_at DESC) WHERE is_hidden = false;
CREATE INDEX post_reactions_post_id_idx ON public.post_reactions(post_id);

CREATE OR REPLACE FUNCTION public.set_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_posts_updated_at();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts: public read visible"
  ON public.posts FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "posts: insert authenticated own"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts: update own"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts: delete own"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "post_reactions: public read"
  ON public.post_reactions FOR SELECT
  USING (true);

CREATE POLICY "post_reactions: insert authenticated own"
  ON public.post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_reactions: update own"
  ON public.post_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_reactions: delete own"
  ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id);
