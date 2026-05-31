-- Connect player season stats to first-class season records.

ALTER TABLE public.player_season_stats
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id);

INSERT INTO public.seasons (name, is_current, display_order)
SELECT DISTINCT season, false, 0
FROM public.player_season_stats
WHERE season IS NOT NULL AND btrim(season) <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE public.player_season_stats
SET season_id = seasons.id
FROM public.seasons
WHERE player_season_stats.season = seasons.name
  AND player_season_stats.season_id IS NULL;

CREATE INDEX IF NOT EXISTS player_season_stats_season_id_idx
  ON public.player_season_stats (season_id);

CREATE UNIQUE INDEX IF NOT EXISTS player_season_stats_player_season_id_unique_idx
  ON public.player_season_stats (player_id, season_id)
  WHERE season_id IS NOT NULL;
