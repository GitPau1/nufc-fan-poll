-- Public comment profiles, player photo storage, and vote integrity guards.

CREATE TABLE IF NOT EXISTS public.public_profiles (
  id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.public_profiles (id, display_name, avatar_url)
SELECT id, display_name, avatar_url
FROM public.users
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profiles (id, display_name, avatar_url, updated_at)
  VALUES (NEW.id, NEW.display_name, NEW.avatar_url, now())
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_profile_on_user_change ON public.users;
CREATE TRIGGER sync_public_profile_on_user_change
  AFTER INSERT OR UPDATE OF display_name, avatar_url ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_profiles: public read" ON public.public_profiles;
CREATE POLICY "public_profiles: public read"
  ON public.public_profiles FOR SELECT
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_public_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_public_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.public_profiles(id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_option_matches_poll_fkey'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS poll_options_id_poll_id_idx
      ON public.poll_options (id, poll_id);

    ALTER TABLE public.votes
      ADD CONSTRAINT votes_option_matches_poll_fkey
      FOREIGN KEY (option_id, poll_id) REFERENCES public.poll_options(id, poll_id)
      NOT VALID;
  END IF;
END;
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "player_photos_public_read" ON storage.objects;
CREATE POLICY "player_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'player-photos');
