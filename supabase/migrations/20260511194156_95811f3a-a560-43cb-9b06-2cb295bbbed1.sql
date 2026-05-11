-- Enums
CREATE TYPE public.rarity AS ENUM ('common','uncommon','rare','epic','legendary');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  draco_points_total BIGINT NOT NULL DEFAULT 0,
  draco_points_pool BIGINT NOT NULL DEFAULT 0,
  etc_balance NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Catalog (15 dragons)
CREATE TABLE public.dragons_catalog (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  interval_seconds INT NOT NULL,
  points_per_egg INT NOT NULL,
  description TEXT
);
ALTER TABLE public.dragons_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog read" ON public.dragons_catalog FOR SELECT TO authenticated USING (true);

INSERT INTO public.dragons_catalog (id,name,slug,interval_seconds,points_per_egg,description) VALUES
(1,'Ember Dragon','ember',300,1,'A swift hatchling of pure flame.'),
(2,'Aqua Dragon','aqua',600,2,'Calm guardian of the deep currents.'),
(3,'Terra Dragon','terra',900,3,'Earthen scales hard as obsidian.'),
(4,'Gale Dragon','gale',1800,6,'Rides the storms above the clouds.'),
(5,'Volt Dragon','volt',3600,12,'Crackles with raw thunder.'),
(6,'Frost Dragon','frost',5400,18,'Breath that freezes oceans.'),
(7,'Shade Dragon','shade',7200,24,'Walks between worlds in shadow.'),
(8,'Solar Dragon','solar',10800,36,'Wings forged from sunlight.'),
(9,'Verdant Dragon','verdant',14400,48,'Heart of the ancient forests.'),
(10,'Stone Dragon','stone',21600,72,'Old as the mountains themselves.'),
(11,'Tide Dragon','tide',28800,96,'Commands the abyssal trenches.'),
(12,'Sand Dragon','sand',43200,144,'King of the burning dunes.'),
(13,'Magma Dragon','magma',57600,192,'Born inside a sleeping volcano.'),
(14,'Cosmic Dragon','cosmic',72000,240,'Forged among distant stars.'),
(15,'Void Dragon','void',86400,288,'Mythic, beyond time.');

-- User dragons
CREATE TABLE public.user_dragons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_id SMALLINT NOT NULL REFERENCES public.dragons_catalog(id),
  rarity public.rarity NOT NULL DEFAULT 'common',
  placed_in_nest UUID,
  farming_started_at TIMESTAMPTZ,
  egg_ready BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.user_dragons (user_id);
ALTER TABLE public.user_dragons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dragons all" ON public.user_dragons FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User nests
CREATE TABLE public.user_nests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rarity public.rarity NOT NULL DEFAULT 'common',
  slot_index INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot_index)
);
CREATE INDEX ON public.user_nests (user_id);
ALTER TABLE public.user_nests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own nests all" ON public.user_nests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User eggs
CREATE TABLE public.user_eggs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_id SMALLINT NOT NULL REFERENCES public.dragons_catalog(id),
  rarity public.rarity NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.user_eggs (user_id);
ALTER TABLE public.user_eggs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own eggs all" ON public.user_eggs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User slots
CREATE TABLE public.user_slots (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_index INT NOT NULL CHECK (slot_index BETWEEN 1 AND 30),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, slot_index)
);
ALTER TABLE public.user_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own slots all" ON public.user_slots FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reward pools
CREATE TABLE public.reward_pools (
  id BIGSERIAL PRIMARY KEY,
  period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_end TIMESTAMPTZ NOT NULL,
  total_etc NUMERIC(20,8) NOT NULL DEFAULT 0.01,
  is_open BOOLEAN NOT NULL DEFAULT true,
  total_points BIGINT NOT NULL DEFAULT 0,
  closed_at TIMESTAMPTZ
);
ALTER TABLE public.reward_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pools read" ON public.reward_pools FOR SELECT TO authenticated USING (true);
CREATE POLICY "pools insert standard" ON public.reward_pools FOR INSERT TO authenticated
  WITH CHECK (total_etc = 0.01 AND period_end > now() AND is_open = true);
CREATE POLICY "pools close expired" ON public.reward_pools FOR UPDATE TO authenticated
  USING (period_end <= now());

CREATE TABLE public.pool_contributions (
  id BIGSERIAL PRIMARY KEY,
  pool_id BIGINT NOT NULL REFERENCES public.reward_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draco_points BIGINT NOT NULL DEFAULT 0,
  UNIQUE (pool_id, user_id)
);
ALTER TABLE public.pool_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contrib read" ON public.pool_contributions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own contrib insert" ON public.pool_contributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own contrib update" ON public.pool_contributions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.pool_rewards (
  id BIGSERIAL PRIMARY KEY,
  pool_id BIGINT NOT NULL REFERENCES public.reward_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  etc_amount NUMERIC(20,8) NOT NULL DEFAULT 0,
  draco_points BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pool_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rewards read" ON public.pool_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own rewards insert" ON public.pool_rewards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Helper: get or create active pool
CREATE OR REPLACE FUNCTION public.get_active_pool()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid BIGINT;
BEGIN
  SELECT id INTO pid FROM public.reward_pools
    WHERE is_open = true AND period_end > now()
    ORDER BY id DESC LIMIT 1;
  IF pid IS NULL THEN
    INSERT INTO public.reward_pools (period_end)
      VALUES (now() + INTERVAL '6 hours')
      RETURNING id INTO pid;
  END IF;
  RETURN pid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_active_pool() FROM PUBLIC, anon, authenticated;

-- Trigger: new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();