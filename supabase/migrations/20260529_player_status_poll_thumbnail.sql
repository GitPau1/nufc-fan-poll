-- Add player squad status and custom poll thumbnails.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS squad_status text NOT NULL DEFAULT 'first_team';

ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS thumbnail_url text;
