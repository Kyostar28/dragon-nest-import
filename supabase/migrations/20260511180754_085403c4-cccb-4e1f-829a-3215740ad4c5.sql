ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS etc_balance numeric NOT NULL DEFAULT 10;
UPDATE public.profiles SET etc_balance = 10 WHERE etc_balance < 10;

-- Update new user trigger so new accounts also get 10 ETC for testing
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rand_id SMALLINT;
BEGIN
  INSERT INTO public.profiles (id, wallet_address, etc_balance)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'wallet_address', NEW.email), 10);

  INSERT INTO public.user_slots (user_id, slot_index) VALUES (NEW.id, 1), (NEW.id, 2);
  INSERT INTO public.user_nests (user_id, rarity) VALUES (NEW.id, 'common');

  SELECT id INTO rand_id FROM public.dragons_catalog ORDER BY random() LIMIT 1;
  INSERT INTO public.user_eggs (user_id, catalog_id, rarity) VALUES (NEW.id, rand_id, 'common');
  RETURN NEW;
END;
$function$;