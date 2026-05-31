-- Promote seasons to first-class records and connect transfer history to them.

CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  starts_at date,
  ends_at date,
  is_current boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS seasons_single_current_idx
  ON public.seasons (is_current)
  WHERE is_current = true;

INSERT INTO public.seasons (name, is_current, display_order)
SELECT DISTINCT season, false, 0
FROM public.transfers
WHERE season IS NOT NULL AND btrim(season) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.seasons (name, is_current, display_order)
SELECT current_season, false, 0
FROM public.club_status
WHERE id = 1 AND current_season IS NOT NULL AND btrim(current_season) <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE public.seasons
SET is_current = false,
    updated_at = now()
WHERE is_current = true
  AND EXISTS (
    SELECT 1
    FROM public.club_status
    WHERE id = 1
      AND current_season IS NOT NULL
      AND btrim(current_season) <> ''
  );

UPDATE public.seasons
SET is_current = true,
    updated_at = now()
FROM public.club_status
WHERE club_status.id = 1
  AND seasons.name = club_status.current_season
  AND club_status.current_season IS NOT NULL
  AND btrim(club_status.current_season) <> '';

ALTER TABLE public.club_status
  ADD COLUMN IF NOT EXISTS current_season_id uuid REFERENCES public.seasons(id);

UPDATE public.club_status
SET current_season_id = seasons.id
FROM public.seasons
WHERE club_status.id = 1
  AND seasons.name = club_status.current_season
  AND club_status.current_season_id IS NULL;

ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id);

UPDATE public.transfers
SET season_id = seasons.id
FROM public.seasons
WHERE transfers.season = seasons.name
  AND transfers.season_id IS NULL;

CREATE INDEX IF NOT EXISTS transfers_season_id_created_at_idx
  ON public.transfers (season_id, created_at DESC);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seasons: public read" ON public.seasons;
CREATE POLICY "seasons: public read"
  ON public.seasons FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "seasons: admin write" ON public.seasons;
CREATE POLICY "seasons: admin write"
  ON public.seasons FOR ALL
  USING (true) WITH CHECK (true);
