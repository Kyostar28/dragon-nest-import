import { supabase } from "@/integrations/supabase/client";
import type { DragonElement } from "@/lib/stats";

export type WorldZone = {
  id: number;
  slug: string;
  name: string;
  kind: "safe" | "pve";
  description: string | null;
};

export type WorldStage = {
  id: number;
  zone_id: number;
  stage_number: number;
  mob_pool: string[];
  has_boss: boolean;
  boss_mob_id: number | null;
};

export type Mob = {
  id: number;
  slug: string;
  name: string;
  element: DragonElement;
  hp: number;
  ap: number;
  attack: number;
  defense: number;
  crit: number;
  level: number;
  is_boss: boolean;
  icon: string | null;
};

export type Spell = {
  id: number;
  element: DragonElement;
  name: string;
  description: string | null;
  ap_cost: number;
  damage: number;
  min_level: number;
  icon: string | null;
};

export async function fetchZones(): Promise<WorldZone[]> {
  const { data, error } = await supabase.from("world_zones").select("*").order("id");
  if (error) throw error;
  return data as WorldZone[];
}

export async function fetchStages(zoneId: number): Promise<WorldStage[]> {
  const { data, error } = await supabase
    .from("world_stages").select("*").eq("zone_id", zoneId).order("stage_number");
  if (error) throw error;
  return (data as any[]).map((r) => ({ ...r, mob_pool: r.mob_pool as string[] }));
}

export async function fetchMobs(): Promise<Mob[]> {
  const { data, error } = await supabase.from("mobs").select("*");
  if (error) throw error;
  return data as Mob[];
}

export async function fetchSpells(element: DragonElement): Promise<Spell[]> {
  const { data, error } = await supabase
    .from("dragon_spells").select("*").eq("element", element).order("min_level");
  if (error) throw error;
  return data as Spell[];
}

export async function fetchProgress(userId: string, zoneId: number) {
  const { data } = await supabase
    .from("user_progress").select("*").eq("user_id", userId).eq("zone_id", zoneId).maybeSingle();
  return (data?.max_stage_unlocked as number | undefined) ?? 1;
}

export async function setProgress(userId: string, zoneId: number, max: number) {
  await supabase
    .from("user_progress")
    .upsert({ user_id: userId, zone_id: zoneId, max_stage_unlocked: max },
      { onConflict: "user_id,zone_id" });
}

export async function breedDragonsRpc(d1: string, d2: string) {
  const { data, error } = await supabase.rpc("breed_dragons", { d1, d2 });
  if (error) throw error;
  return data as string;
}

export async function breedNestsRpc(n1: string, n2: string) {
  const { data, error } = await supabase.rpc("breed_nests", { n1, n2 });
  if (error) throw error;
  return data as string;
}

export async function gainXp(dragonId: string, userId: string, amount: number) {
  const { data: d } = await supabase
    .from("user_dragons").select("xp, level").eq("id", dragonId).single();
  if (!d) return;
  let xp = (d.xp ?? 0) + amount;
  let level = d.level ?? 1;
  while (xp >= level * level * 100 && level < 50) {
    xp -= level * level * 100;
    level += 1;
  }
  await supabase.from("user_dragons").update({ xp, level }).eq("id", dragonId).eq("user_id", userId);
}
