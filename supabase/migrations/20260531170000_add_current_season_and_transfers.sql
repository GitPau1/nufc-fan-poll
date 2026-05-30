-- Add current season to club status and create transfer history records.

ALTER TABLE public.club_status
  ADD COLUMN IF NOT EXISTS current_season text;

CREATE TABLE IF NOT EXISTS public.transfers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  direction     text NOT NULL CHECK (direction IN ('in', 'out')),
  transfer_type text NOT NULL,
  season        text NOT NULL,
  club_name     text,
  note          text,
  is_published  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transfers_season_created_at_idx
  ON public.transfers (season, created_at DESC);

CREATE INDEX IF NOT EXISTS transfers_player_created_at_idx
  ON public.transfers (player_id, created_at DESC);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transfers: public read published" ON public.transfers;
CREATE POLICY "transfers: public read published"
  ON public.transfers FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "transfers: admin write" ON public.transfers;
CREATE POLICY "transfers: admin write"
  ON public.transfers FOR ALL
  USING (true) WITH CHECK (true);
