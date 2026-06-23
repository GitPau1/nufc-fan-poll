-- Pick One weekly rating movement cap.

CREATE OR REPLACE FUNCTION public.apply_player_pick_one_week(target_week_end_at timestamptz DEFAULT now())
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  kst_offset interval := interval '9 hours';
  target_week_end timestamptz;
  target_week_start timestamptz;
  current_run_id uuid;
  run_status text;
  choice_record record;
  winner_rating numeric;
  loser_rating numeric;
  winner_previous numeric;
  loser_previous numeric;
  expected numeric;
  delta numeric;
  revalidate_endpoint_url text;
  revalidate_secret text;
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
  RETURNING id INTO current_run_id;

  IF current_run_id IS NULL THEN
    SELECT id, status INTO current_run_id, run_status
    FROM public.player_pick_one_weekly_runs
    WHERE week_start_at = target_week_start
      AND week_end_at = target_week_end;

    IF run_status = 'applied' THEN
      RETURN current_run_id;
    END IF;

    DELETE FROM public.player_pick_one_rating_changes
    WHERE player_pick_one_rating_changes.run_id = current_run_id;

    UPDATE public.player_pick_one_weekly_runs
    SET status = 'running',
        error_message = NULL,
        applied_at = NULL
    WHERE id = current_run_id;
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
      current_run_id,
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
      current_run_id,
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

  WITH capped_changes AS (
    SELECT
      player_id,
      least(player_pick_one_rating_changes.previous_rating + 2, greatest(player_pick_one_rating_changes.previous_rating - 2, new_rating)) AS capped_rating
    FROM public.player_pick_one_rating_changes
    WHERE run_id = current_run_id
  )
  UPDATE public.player_pick_one_rating_changes
  SET new_rating = capped_changes.capped_rating,
      new_overall = public.pick_one_overall(capped_rating),
      delta = public.pick_one_overall(capped_rating) - previous_overall
  FROM capped_changes
  WHERE player_pick_one_rating_changes.run_id = current_run_id
    AND player_pick_one_rating_changes.player_id = capped_changes.player_id;

  UPDATE public.player_pick_one_ratings
  SET rating = player_pick_one_rating_changes.new_rating,
      updated_at = now()
  FROM public.player_pick_one_rating_changes
  WHERE player_pick_one_rating_changes.run_id = current_run_id
    AND player_pick_one_ratings.player_id = player_pick_one_rating_changes.player_id;

  UPDATE public.player_pick_one_weekly_runs
  SET status = 'applied',
      applied_at = now()
  WHERE id = current_run_id;

  SELECT endpoint_url, secret
  INTO revalidate_endpoint_url, revalidate_secret
  FROM public.player_pick_one_revalidation_config
  WHERE id = true;

  IF revalidate_endpoint_url IS NOT NULL AND revalidate_secret IS NOT NULL THEN
    PERFORM net.http_post(
      url := revalidate_endpoint_url || '/api/revalidate',
      headers := jsonb_build_object('Authorization', 'Bearer ' || revalidate_secret),
      body := jsonb_build_object('runId', current_run_id)
    );
  END IF;
  EXCEPTION
    WHEN OTHERS THEN
      UPDATE public.player_pick_one_weekly_runs
      SET status = 'failed',
          error_message = SQLERRM,
          applied_at = now()
      WHERE id = current_run_id;
      RAISE;
  END;

  RETURN current_run_id;
END;
$$;

DO $$
DECLARE
  latest_run_id uuid;
BEGIN
  SELECT id INTO latest_run_id
  FROM public.player_pick_one_weekly_runs
  WHERE status = 'applied'
  ORDER BY week_end_at DESC
  LIMIT 1;

  IF latest_run_id IS NOT NULL THEN
    WITH capped_changes AS (
      SELECT
        player_id,
        least(player_pick_one_rating_changes.previous_rating + 2, greatest(player_pick_one_rating_changes.previous_rating - 2, new_rating)) AS capped_rating
      FROM public.player_pick_one_rating_changes
      WHERE run_id = latest_run_id
    )
    UPDATE public.player_pick_one_rating_changes
    SET new_rating = capped_changes.capped_rating,
        new_overall = public.pick_one_overall(capped_rating),
        delta = public.pick_one_overall(capped_rating) - previous_overall
    FROM capped_changes
    WHERE player_pick_one_rating_changes.run_id = latest_run_id
      AND player_pick_one_rating_changes.player_id = capped_changes.player_id;

    UPDATE public.player_pick_one_ratings
    SET rating = player_pick_one_rating_changes.new_rating,
        updated_at = now()
    FROM public.player_pick_one_rating_changes
    WHERE player_pick_one_rating_changes.run_id = latest_run_id
      AND player_pick_one_ratings.player_id = player_pick_one_rating_changes.player_id;
  END IF;
END;
$$;
