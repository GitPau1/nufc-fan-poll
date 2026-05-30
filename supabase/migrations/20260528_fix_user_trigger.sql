-- supabase/migrations/20260528_fix_user_trigger.sql
-- Override handle_new_user trigger to leave display_name null.
-- display_name is set during the onboarding flow (not auto-populated).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, avatar_url, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NULL  -- intentionally null; set during /onboarding
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
