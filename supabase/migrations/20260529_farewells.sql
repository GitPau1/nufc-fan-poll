-- Add Farewell posts for departing players.

CREATE TABLE public.farewells (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         uuid NOT NULL REFERENCES public.players(id),
  departure_type    text NOT NULL DEFAULT 'released',
  destination_club  text,
  departure_note    text,
  appearances       int,
  goals             int,
  assists           int,
  clean_sheets      int,
  joined_at         date,
  left_at           date,
  is_published      boolean NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE public.farewell_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farewell_id  uuid NOT NULL REFERENCES public.farewells(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id),
  content      text NOT NULL CHECK (char_length(content) <= 500),
  is_hidden    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.farewells         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farewell_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farewells: public read published"
  ON public.farewells FOR SELECT
  USING (is_published = true);

CREATE POLICY "farewell_comments: public read"
  ON public.farewell_comments FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "farewell_comments: insert authenticated"
  ON public.farewell_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
