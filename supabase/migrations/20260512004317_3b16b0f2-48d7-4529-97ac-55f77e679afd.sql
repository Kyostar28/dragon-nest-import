
DO $$ BEGIN
  CREATE TYPE public.dragon_element AS ENUM ('fire','water','earth','air','light','dark','nature','arcane','ice','thunder');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.dragons_catalog
  ADD COLUMN IF NOT EXISTS element public.dragon_element NOT NULL DEFAULT 'fire',
  ADD COLUMN IF NOT EXISTS base_hp int NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS base_ap int NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS base_defense int NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS base_crit int NOT NULL DEFAULT 5;

ALTER TABLE public.user_dragons
  ADD COLUMN IF NOT EXISTS level int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_hp int;

CREATE TABLE IF NOT EXISTS public.dragon_spells (
  id bigserial PRIMARY KEY,
  element public.dragon_element NOT NULL,
  name text NOT NULL, description text,
  ap_cost int NOT NULL, damage int NOT NULL,
  min_level int NOT NULL DEFAULT 1, icon text
);
ALTER TABLE public.dragon_spells ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spells read" ON public.dragon_spells;
CREATE POLICY "spells read" ON public.dragon_spells FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.world_zones (
  id bigserial PRIMARY KEY, slug text NOT NULL UNIQUE, name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('safe','pve')), description text
);
ALTER TABLE public.world_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "zones read" ON public.world_zones;
CREATE POLICY "zones read" ON public.world_zones FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.mobs (
  id bigserial PRIMARY KEY, slug text NOT NULL UNIQUE, name text NOT NULL,
  element public.dragon_element NOT NULL DEFAULT 'earth',
  hp int NOT NULL, ap int NOT NULL DEFAULT 6,
  attack int NOT NULL, defense int NOT NULL,
  crit int NOT NULL DEFAULT 5, level int NOT NULL DEFAULT 1,
  is_boss boolean NOT NULL DEFAULT false, icon text
);
ALTER TABLE public.mobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mobs read" ON public.mobs;
CREATE POLICY "mobs read" ON public.mobs FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.world_stages (
  id bigserial PRIMARY KEY,
  zone_id bigint NOT NULL REFERENCES public.world_zones(id) ON DELETE CASCADE,
  stage_number int NOT NULL,
  mob_pool jsonb NOT NULL DEFAULT '[]'::jsonb,
  boss_mob_id bigint REFERENCES public.mobs(id),
  has_boss boolean NOT NULL DEFAULT false,
  UNIQUE(zone_id, stage_number)
);
ALTER TABLE public.world_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stages read" ON public.world_stages;
CREATE POLICY "stages read" ON public.world_stages FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id uuid NOT NULL,
  zone_id bigint NOT NULL REFERENCES public.world_zones(id) ON DELETE CASCADE,
  max_stage_unlocked int NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, zone_id)
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own progress all" ON public.user_progress;
CREATE POLICY "own progress all" ON public.user_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.battle_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stage_id bigint NOT NULL REFERENCES public.world_stages(id),
  dragon_id uuid NOT NULL REFERENCES public.user_dragons(id) ON DELETE CASCADE,
  current_mob_index int NOT NULL DEFAULT 0,
  mob_sequence jsonb NOT NULL,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  turn text NOT NULL DEFAULT 'player',
  turn_started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.battle_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own battles all" ON public.battle_sessions;
CREATE POLICY "own battles all" ON public.battle_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.next_rarity(_r public.rarity)
RETURNS public.rarity LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _r
    WHEN 'common' THEN 'uncommon'::public.rarity
    WHEN 'uncommon' THEN 'rare'::public.rarity
    WHEN 'rare' THEN 'epic'::public.rarity
    WHEN 'epic' THEN 'legendary'::public.rarity
    ELSE NULL END;
$$;

CREATE OR REPLACE FUNCTION public.breed_dragons(d1 uuid, d2 uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r1 record; r2 record; nr public.rarity; new_id uuid;
BEGIN
  SELECT * INTO r1 FROM public.user_dragons WHERE id = d1 AND user_id = auth.uid();
  SELECT * INTO r2 FROM public.user_dragons WHERE id = d2 AND user_id = auth.uid();
  IF r1 IS NULL OR r2 IS NULL THEN RAISE EXCEPTION 'Dragones no encontrados'; END IF;
  IF r1.id = r2.id THEN RAISE EXCEPTION 'Selecciona dos dragones distintos'; END IF;
  IF r1.catalog_id <> r2.catalog_id THEN RAISE EXCEPTION 'Deben ser de la misma especie'; END IF;
  IF r1.rarity <> r2.rarity THEN RAISE EXCEPTION 'Deben ser de la misma rareza'; END IF;
  nr := public.next_rarity(r1.rarity);
  IF nr IS NULL THEN RAISE EXCEPTION 'Rareza máxima alcanzada'; END IF;
  DELETE FROM public.user_dragons WHERE id IN (r1.id, r2.id);
  INSERT INTO public.user_dragons (user_id, catalog_id, rarity, egg_ready, level, xp)
    VALUES (auth.uid(), r1.catalog_id, nr, true, 1, 0)
    RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.breed_nests(n1 uuid, n2 uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r1 record; r2 record; nr public.rarity; new_id uuid;
BEGIN
  SELECT * INTO r1 FROM public.user_nests WHERE id = n1 AND user_id = auth.uid();
  SELECT * INTO r2 FROM public.user_nests WHERE id = n2 AND user_id = auth.uid();
  IF r1 IS NULL OR r2 IS NULL THEN RAISE EXCEPTION 'Nidos no encontrados'; END IF;
  IF r1.id = r2.id THEN RAISE EXCEPTION 'Selecciona dos nidos distintos'; END IF;
  IF r1.rarity <> r2.rarity THEN RAISE EXCEPTION 'Deben ser de la misma rareza'; END IF;
  nr := public.next_rarity(r1.rarity);
  IF nr IS NULL THEN RAISE EXCEPTION 'Rareza máxima alcanzada'; END IF;
  DELETE FROM public.user_nests WHERE id IN (r1.id, r2.id);
  INSERT INTO public.user_nests (user_id, rarity)
    VALUES (auth.uid(), nr)
    RETURNING id INTO new_id;
  RETURN new_id;
END $$;

UPDATE public.dragons_catalog SET element = (
  ARRAY['fire','water','earth','air','light','dark','nature','arcane','ice','thunder']::public.dragon_element[]
)[((id - 1) % 10) + 1];

INSERT INTO public.world_zones (slug, name, kind, description) VALUES
  ('city', 'Ciudad', 'safe', 'Refugio seguro. Sin combate.'),
  ('forest', 'Bosque Verde', 'pve', 'Zona PvE. 20 niveles, 3 mobs por etapa.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.mobs (slug, name, element, hp, ap, attack, defense, crit, level, is_boss, icon) VALUES
  ('wolf','Lobo','nature',60,5,12,4,5,1,false,'🐺'),
  ('bear','Oso','earth',95,5,16,8,5,2,false,'🐻'),
  ('lion','León','fire',110,6,20,10,8,3,false,'🦁'),
  ('boar','Jabalí','earth',80,5,15,6,4,2,false,'🐗'),
  ('bandit','Bandido','dark',70,6,18,5,10,3,false,'🗡️'),
  ('shadow','Sombra','dark',90,6,17,7,8,3,false,'👤'),
  ('forest_lord','Señor del Bosque','nature',600,8,40,25,15,20,true,'👹')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE fz_id bigint; boss_id bigint; i int;
BEGIN
  SELECT id INTO fz_id FROM public.world_zones WHERE slug = 'forest';
  SELECT id INTO boss_id FROM public.mobs WHERE slug = 'forest_lord';
  FOR i IN 1..20 LOOP
    INSERT INTO public.world_stages (zone_id, stage_number, mob_pool, has_boss, boss_mob_id)
    VALUES (fz_id, i, '["wolf","bear","lion","boar","bandit","shadow"]'::jsonb,
      (i = 20), CASE WHEN i = 20 THEN boss_id ELSE NULL END)
    ON CONFLICT (zone_id, stage_number) DO NOTHING;
  END LOOP;
END $$;

INSERT INTO public.dragon_spells (element, name, description, ap_cost, damage, min_level, icon) VALUES
  ('fire','Bola de Fuego','Esfera ardiente',3,25,1,'🔥'),
  ('fire','Inferno','Devastador estallido',5,55,5,'☄️'),
  ('water','Chorro Glacial','Agua a presión',3,22,1,'💧'),
  ('water','Tsunami','Marea destructora',5,50,5,'🌊'),
  ('earth','Lanza de Roca','Pico mineral',3,24,1,'🪨'),
  ('earth','Terremoto','Sacudida brutal',5,52,5,'🌋'),
  ('air','Cuchilla de Viento','Corte veloz',2,18,1,'🌪️'),
  ('air','Ciclón','Tornado letal',5,48,5,'💨'),
  ('light','Rayo Solar','Haz radiante',3,26,1,'✨'),
  ('light','Juicio','Castigo divino',6,65,7,'⚡'),
  ('dark','Drenar','Roba vida',3,20,1,'🌑'),
  ('dark','Eclipse','Oscuridad absoluta',5,55,5,'🌚'),
  ('nature','Espinas','Daño verde',2,17,1,'🌿'),
  ('nature','Bosque Salvaje','Raíces masivas',5,50,5,'🌲'),
  ('arcane','Misil Arcano','Energía pura',3,25,1,'🔮'),
  ('arcane','Anulación','Estallido mágico',5,55,5,'💫'),
  ('ice','Lanza de Hielo','Ataque congelante',3,23,1,'❄️'),
  ('ice','Ventisca','Tormenta polar',5,52,5,'🌨️'),
  ('thunder','Chispa','Descarga rápida',2,19,1,'⚡'),
  ('thunder','Tempestad','Trueno devastador',5,56,5,'🌩️');
