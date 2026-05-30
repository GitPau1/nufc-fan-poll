-- Extend transfer event types and add player season history.

CREATE TABLE IF NOT EXISTS public.player_season_stats (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season       text NOT NULL,
  appearances  int NOT NULL DEFAULT 0 CHECK (appearances >= 0),
  goals        int NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists      int NOT NULL DEFAULT 0 CHECK (assists >= 0),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (player_id, season)
);

ALTER TABLE public.player_season_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_season_stats_public_read" ON public.player_season_stats;
CREATE POLICY "player_season_stats_public_read" ON public.player_season_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "player_season_stats_admin_write" ON public.player_season_stats;
CREATE POLICY "player_season_stats_admin_write" ON public.player_season_stats
  FOR ALL USING (true) WITH CHECK (true);
