-- =====================================================
-- NUFC Fan Poll — Initial Schema
-- =====================================================

-- -------------------------------------------------------
-- 1. Tables
-- -------------------------------------------------------

-- Users (synced from auth.users via trigger)
CREATE TABLE public.users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  avatar_url   text,
  display_name text,
  created_at   timestamptz DEFAULT now(),
  deleted_at   timestamptz  -- soft delete for account deletion
);

-- Players / Managers
CREATE TABLE public.players (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  position     text,  -- 'GK' | 'DEF' | 'MID' | 'FWD' | 'MGR'
  squad_number int,
  photo_url    text,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

-- Polls
CREATE TABLE public.polls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL,          -- 'evaluation' | 'selection'
  title        text NOT NULL,
  description  text,
  player_id    uuid REFERENCES public.players(id),  -- Type A only
  status       text NOT NULL DEFAULT 'active',       -- 'scheduled' | 'active' | 'closed'
  scheduled_at timestamptz,
  closes_at    timestamptz NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- Poll Options
CREATE TABLE public.poll_options (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id       uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label         text NOT NULL,
  player_id     uuid REFERENCES public.players(id),  -- Type B only
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- Votes (immutable — no UPDATE/DELETE allowed)
CREATE TABLE public.votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid NOT NULL REFERENCES public.polls(id),
  user_id    uuid NOT NULL REFERENCES public.users(id),
  option_id  uuid NOT NULL REFERENCES public.poll_options(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)  -- one vote per user per poll
);

-- Comments (only visible after user has voted)
CREATE TABLE public.comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid NOT NULL REFERENCES public.polls(id),
  user_id    uuid NOT NULL REFERENCES public.users(id),
  content    text NOT NULL CHECK (char_length(content) <= 500),
  is_hidden  boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Comment Likes
CREATE TABLE public.comment_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)  -- one like per user per comment
);


-- -------------------------------------------------------
-- 2. Auth Trigger — sync auth.users → public.users
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, avatar_url, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- -------------------------------------------------------
-- 3. Enable RLS on all tables
-- -------------------------------------------------------

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes  ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------
-- 4. RLS Policies
-- -------------------------------------------------------

-- users: own row only
CREATE POLICY "users: select own row"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- players: public read, no write for regular users
CREATE POLICY "players: public read"
  ON public.players FOR SELECT
  USING (true);

-- polls: public read
CREATE POLICY "polls: public read"
  ON public.polls FOR SELECT
  USING (true);

-- poll_options: public read
CREATE POLICY "poll_options: public read"
  ON public.poll_options FOR SELECT
  USING (true);

-- votes: own records + insert for authenticated users
CREATE POLICY "votes: select own"
  ON public.votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "votes: insert authenticated"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- comments: public read (non-hidden), insert for voters only
CREATE POLICY "comments: public read"
  ON public.comments FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "comments: insert for voters"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.votes
      WHERE votes.poll_id = comments.poll_id
        AND votes.user_id = auth.uid()
    )
  );

-- comment_likes: public read, insert authenticated, delete own
CREATE POLICY "comment_likes: public read"
  ON public.comment_likes FOR SELECT
  USING (true);

CREATE POLICY "comment_likes: insert authenticated"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comment_likes: delete own"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);