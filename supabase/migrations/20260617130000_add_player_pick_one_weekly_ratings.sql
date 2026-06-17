-- Weekly Pick One rating storage and Sunday KST batch application.

CREATE TABLE public.player_pick_one_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  winner_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  loser_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player_a_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player_b_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  week_start_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_pick_one_choices_distinct_players
    CHECK (winner_player_id <> loser_player_id AND player_a_id < player_b_id),
  CONSTRAINT player_pick_one_choices_winner_in_pair
    CHECK (winner_player_id = player_a_id OR winner_player_id = player_b_id),
  CONSTRAINT player_pick_one_choices_loser_in_pair
    CHECK (loser_player_id = player_a_id OR loser_player_id = player_b_id),
  CONSTRAINT player_pick_one_choices_one_pair_per_week
    UNIQUE (user_id, player_a_id, player_b_id, week_start_at)
);

CREATE INDEX player_pick_one_choices_week_start_idx
  ON public.player_pick_one_choices (week_start_at, created_at);

CREATE TABLE public.player_pick_one_ratings (
  player_id uuid PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  rating numeric NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  choice_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.player_pick_one_weekly_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_at timestamptz NOT NULL UNIQUE,
  week_end_at timestamptz NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'running',
  applied_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.player_pick_one_rating_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.player_pick_one_weekly_runs(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  previous_rating numeric NOT NULL,
  new_rating numeric NOT NULL,
  previous_overall integer NOT NULL,
  new_overall integer NOT NULL,
  delta integer NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, player_id)
);

ALTER TABLE public.player_pick_one_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_pick_one_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_pick_one_weekly_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_pick_one_rating_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_pick_one_choices: insert own"
  ON public.player_pick_one_choices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "player_pick_one_choices: select own"
  ON public.player_pick_one_choices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "player_pick_one_ratings: public read"
  ON public.player_pick_one_ratings FOR SELECT
  USING (true);

CREATE POLICY "player_pick_one_weekly_runs: public read applied"
  ON public.player_pick_one_weekly_runs FOR SELECT
  USING (status = 'applied');

CREATE POLICY "player_pick_one_rating_changes: public read"
  ON public.player_pick_one_rating_changes FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.pick_one_overall(input_rating numeric)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT least(99, greatest(40, round(input_rating)::integer));
$$;

CREATE OR REPLACE FUNCTION public.apply_player_pick_one_week(target_week_end_at timestamptz DEFAULT now())
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  kst_offset interval := interval '9 hours';
  target_week_end timestamptz;
  target_week_start timestamptz;
  run_id uuid;
  run_status text;
  choice_record record;
  winner_rating numeric;
  loser_rating numeric;
  winner_previous numeric;
  loser_previous numeric;
  expected numeric;
  delta numeric;
BEGIN
  target_week_end := (
    date_trunc('week', target_week_end_at + kst_offset + interval '1 day')
    - interval '1 day'
    - kst_offset
  );
  target_week_start := target_week_end - interval '7 days';

  INSERT INTO public.player_pick_one_weekly_runs (week_start_at, week_end_at)
  VALUES (target_week_start, target_week_end)
  ON CONFLICT (week_start_at) DO NOTHING
  RETURNING id INTO run_id;

  IF run_id IS NULL THEN
    SELECT id, status INTO run_id, run_status
    FROM public.player_pick_one_weekly_runs
    WHERE week_start_at = target_week_start
      AND week_end_at = target_week_end;

    IF run_status = 'applied' THEN
      RETURN run_id;
    END IF;

    DELETE FROM public.player_pick_one_rating_changes
    WHERE player_pick_one_rating_changes.run_id = run_id;

    UPDATE public.player_pick_one_weekly_runs
    SET status = 'running',
        error_message = NULL,
        applied_at = NULL
    WHERE id = run_id;
  END IF;

  BEGIN
  FOR choice_record IN
    SELECT winner_player_id, loser_player_id
    FROM public.player_pick_one_choices
    WHERE created_at >= target_week_start
      AND created_at < target_week_end
    ORDER BY created_at, id
  LOOP
    INSERT INTO public.player_pick_one_ratings (player_id, rating)
    SELECT choice_record.winner_player_id, players.base_rating
    FROM public.players
    WHERE players.id = choice_record.winner_player_id
    ON CONFLICT (player_id) DO NOTHING;

    INSERT INTO public.player_pick_one_ratings (player_id, rating)
    SELECT choice_record.loser_player_id, players.base_rating
    FROM public.players
    WHERE players.id = choice_record.loser_player_id
    ON CONFLICT (player_id) DO NOTHING;

    SELECT rating INTO winner_rating
    FROM public.player_pick_one_ratings
    WHERE player_id = choice_record.winner_player_id
    FOR UPDATE;

    SELECT rating INTO loser_rating
    FROM public.player_pick_one_ratings
    WHERE player_id = choice_record.loser_player_id
    FOR UPDATE;

    winner_previous := winner_rating;
    loser_previous := loser_rating;
    expected := 1 / (1 + power(10, (loser_rating - winner_rating) / 12));
    delta := 1.2 * (1 - expected);

    UPDATE public.player_pick_one_ratings
    SET rating = winner_rating + delta,
        wins = wins + 1,
        choice_count = choice_count + 1,
        updated_at = now()
    WHERE player_id = choice_record.winner_player_id;

    UPDATE public.player_pick_one_ratings
    SET rating = loser_rating - delta,
        losses = losses + 1,
        choice_count = choice_count + 1,
        updated_at = now()
    WHERE player_id = choice_record.loser_player_id;

    INSERT INTO public.player_pick_one_rating_changes (
      run_id,
      player_id,
      previous_rating,
      new_rating,
      previous_overall,
      new_overall,
      delta,
      wins,
      losses
    )
    VALUES (
      run_id,
      choice_record.winner_player_id,
      winner_previous,
      winner_rating + delta,
      public.pick_one_overall(winner_previous),
      public.pick_one_overall(winner_rating + delta),
      public.pick_one_overall(winner_rating + delta) - public.pick_one_overall(winner_previous),
      1,
      0
    )
    ON CONFLICT (run_id, player_id) DO UPDATE SET
      new_rating = EXCLUDED.new_rating,
      new_overall = EXCLUDED.new_overall,
      delta = EXCLUDED.new_overall - player_pick_one_rating_changes.previous_overall,
      wins = player_pick_one_rating_changes.wins + 1;

    INSERT INTO public.player_pick_one_rating_changes (
      run_id,
      player_id,
      previous_rating,
      new_rating,
      previous_overall,
      new_overall,
      delta,
      wins,
      losses
    )
    VALUES (
      run_id,
      choice_record.loser_player_id,
      loser_previous,
      loser_rating - delta,
      public.pick_one_overall(loser_previous),
      public.pick_one_overall(loser_rating - delta),
      public.pick_one_overall(loser_rating - delta) - public.pick_one_overall(loser_previous),
      0,
      1
    )
    ON CONFLICT (run_id, player_id) DO UPDATE SET
      new_rating = EXCLUDED.new_rating,
      new_overall = EXCLUDED.new_overall,
      delta = EXCLUDED.new_overall - player_pick_one_rating_changes.previous_overall,
      losses = player_pick_one_rating_changes.losses + 1;
  END LOOP;

  UPDATE public.player_pick_one_weekly_runs
  SET status = 'applied',
      applied_at = now()
  WHERE id = run_id;
  EXCEPTION
    WHEN OTHERS THEN
      UPDATE public.player_pick_one_weekly_runs
      SET status = 'failed',
          error_message = SQLERRM,
          applied_at = now()
      WHERE id = run_id;
      RAISE;
  END;

  RETURN run_id;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('apply-player-pick-one-weekly-ratings');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

SELECT cron.schedule(
  'apply-player-pick-one-weekly-ratings',
  '0 15 * * 6',
  $$SELECT public.apply_player_pick_one_week(now());$$
);
