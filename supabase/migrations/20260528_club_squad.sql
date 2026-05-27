-- supabase/migrations/20260528_club_squad.sql

-- 1. players 테이블 컬럼 추가
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS birth_date  date;

-- 2. club_status 테이블 (항상 1행 유지)
CREATE TABLE IF NOT EXISTS public.club_status (
  id                          int PRIMARY KEY DEFAULT 1,
  league_rank                 int,
  next_match_opponent         text,
  next_match_date             text,
  next_match_venue            text,
  top_appearances_player_id   uuid REFERENCES public.players(id),
  top_appearances_count       int,
  top_goals_player_id         uuid REFERENCES public.players(id),
  top_goals_count             int,
  top_assists_player_id       uuid REFERENCES public.players(id),
  top_assists_count           int,
  updated_at                  timestamptz DEFAULT now()
);

-- 초기 행 삽입 (없으면)
INSERT INTO public.club_status (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.club_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_status_public_read" ON public.club_status
  FOR SELECT USING (true);

CREATE POLICY "club_status_admin_write" ON public.club_status
  FOR ALL USING (true) WITH CHECK (true);
