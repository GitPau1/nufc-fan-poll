-- Add supporting indexes for hot poll result and Pick One read paths.

CREATE INDEX IF NOT EXISTS votes_poll_id_idx
  ON public.votes (poll_id);

CREATE INDEX IF NOT EXISTS votes_poll_id_user_id_idx
  ON public.votes (poll_id, user_id);

CREATE INDEX IF NOT EXISTS comments_visible_poll_created_at_idx
  ON public.comments (poll_id, created_at DESC)
  WHERE is_hidden = false;

CREATE INDEX IF NOT EXISTS comment_likes_user_comment_idx
  ON public.comment_likes (user_id, comment_id);

CREATE INDEX IF NOT EXISTS rating_votes_poll_id_idx
  ON public.rating_votes (poll_id);

CREATE INDEX IF NOT EXISTS rating_votes_poll_user_idx
  ON public.rating_votes (poll_id, user_id);

CREATE INDEX IF NOT EXISTS rating_vote_likes_user_vote_idx
  ON public.rating_vote_likes (user_id, rating_vote_id);

CREATE INDEX IF NOT EXISTS player_pick_one_weekly_runs_applied_week_end_idx
  ON public.player_pick_one_weekly_runs (week_end_at DESC)
  WHERE status = 'applied';

CREATE INDEX IF NOT EXISTS player_pick_one_rating_changes_run_delta_idx
  ON public.player_pick_one_rating_changes (run_id, delta DESC);
