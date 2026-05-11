import { supabase } from "@/integrations/supabase/client";
import { EGGS_PER_NEST, RARITY_MULTIPLIER, type Rarity, nextRarity } from "@/lib/dragons";

/** DP value of a single egg = base points of the dragon element × rarity multiplier */
export function eggDPValue(catalog: Pick<CatalogRow, "points_per_egg">, rarity: Rarity) {
  return Math.round(catalog.points_per_egg * RARITY_MULTIPLIER[rarity]);
}

export type DBProfile = {
  id: string;
  wallet_address: string;
  draco_points_total: number;
  draco_points_pool: number;
  etc_balance: number;
};

export const DRAGON_EGG_PRICE_ETC = 0.01;

/** Buy a "dragon egg" with ETC: instantly hatches a random common dragon. */
export async function buyDragonEgg(userId: string, catalog: CatalogRow[]) {
  const { data: prof, error: pe } = await supabase
    .from("profiles")
    .select("etc_balance")
    .eq("id", userId)
    .single();
  if (pe) throw pe;
  const bal = Number(prof?.etc_balance ?? 0);
  if (bal < DRAGON_EGG_PRICE_ETC) throw new Error("Saldo ETC insuficiente");
  if (catalog.length === 0) throw new Error("Catálogo vacío");

  const pick = catalog[Math.floor(Math.random() * catalog.length)];

  const upd = await supabase
    .from("profiles")
    .update({ etc_balance: bal - DRAGON_EGG_PRICE_ETC })
    .eq("id", userId);
  if (upd.error) throw upd.error;

  const ins = await supabase
    .from("user_dragons")
    .insert({ user_id: userId, catalog_id: pick.id, rarity: "common" })
    .select()
    .single();
  if (ins.error) throw ins.error;
  return { dragon: ins.data as DBDragon, catalog: pick };
}

export type DBDragon = {
  id: string;
  user_id: string;
  catalog_id: number;
  rarity: Rarity;
  placed_in_nest: string | null;
  farming_started_at: string | null;
  egg_ready: boolean;
};

export type DBNest = {
  id: string;
  user_id: string;
  rarity: Rarity;
  slot_index: number | null;
};

export type DBEgg = {
  id: string;
  user_id: string;
  catalog_id: number;
  rarity: Rarity;
};

export type CatalogRow = {
  id: number;
  name: string;
  slug: string;
  interval_seconds: number;
  points_per_egg: number;
};

export type DBPool = {
  id: number;
  period_start: string;
  period_end: string;
  total_etc: number;
  is_open: boolean;
  total_points: number;
  closed_at: string | null;
};

export async function fetchCatalog(): Promise<CatalogRow[]> {
  const { data, error } = await supabase.from("dragons_catalog").select("*").order("id");
  if (error) throw error;
  return data as CatalogRow[];
}

export async function fetchProfile(userId: string): Promise<DBProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as DBProfile | null;
}

export async function fetchAllUserData(userId: string) {
  const [dragons, nests, eggs, slots] = await Promise.all([
    supabase.from("user_dragons").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("user_nests").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("user_eggs").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("user_slots").select("slot_index").eq("user_id", userId),
  ]);
  if (dragons.error) throw dragons.error;
  if (nests.error) throw nests.error;
  if (eggs.error) throw eggs.error;
  if (slots.error) throw slots.error;
  return {
    dragons: (dragons.data ?? []) as DBDragon[],
    nests: (nests.data ?? []) as DBNest[],
    eggs: (eggs.data ?? []) as DBEgg[],
    unlockedSlots: new Set<number>((slots.data ?? []).map((s) => s.slot_index as number)),
  };
}

// ---------- Pool ----------

export async function fetchActivePool(): Promise<DBPool | null> {
  const { data: openPool } = await supabase
    .from("reward_pools")
    .select("*")
    .eq("is_open", true)
    .gt("period_end", new Date().toISOString())
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openPool) return openPool as DBPool;

  // Close any expired open pool, distribute rewards proportional to contributions
  const { data: expired } = await supabase
    .from("reward_pools")
    .select("*")
    .eq("is_open", true)
    .lte("period_end", new Date().toISOString())
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (expired) {
    await closePoolAndDistribute(expired as DBPool);
  }

  // Create a new active pool
  const periodEnd = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const { data: created, error } = await supabase
    .from("reward_pools")
    .insert({ total_etc: 0.01, period_end: periodEnd, is_open: true })
    .select()
    .single();
  if (error) {
    const { data: refetch } = await supabase
      .from("reward_pools")
      .select("*")
      .eq("is_open", true)
      .gt("period_end", new Date().toISOString())
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (refetch as DBPool) ?? null;
  }
  return created as DBPool;
}

async function closePoolAndDistribute(pool: DBPool) {
  const { data: contribs } = await supabase
    .from("pool_contributions")
    .select("user_id, draco_points")
    .eq("pool_id", pool.id);
  const total = (contribs ?? []).reduce((s, c) => s + (c.draco_points as number), 0);
  if (total > 0 && contribs) {
    for (const c of contribs) {
      const share = ((c.draco_points as number) / total) * Number(pool.total_etc);
      await supabase.from("pool_rewards").insert({
        pool_id: pool.id,
        user_id: c.user_id,
        etc_amount: share,
        draco_points: c.draco_points,
      });
    }
  }
  await supabase
    .from("reward_pools")
    .update({ is_open: false, total_points: total, closed_at: new Date().toISOString() })
    .eq("id", pool.id);
}

export async function fetchPoolContribution(userId: string, poolId: number) {
  const { data } = await supabase
    .from("pool_contributions")
    .select("draco_points")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.draco_points as number | undefined) ?? 0;
}

export async function fetchUserRewards(userId: string) {
  const { data } = await supabase
    .from("pool_rewards")
    .select("etc_amount, pool_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

// ---------- Mutations (RLS-protected, run as user) ----------

// Eggs are NOT hatched into dragons. They live in the inventory until the user
// deposits them into the active reward pool to contribute Draco Points.
export async function depositEggsToPool(args: {
  eggs: DBEgg[];
  catalogById: Map<number, CatalogRow>;
  pool: DBPool;
  userId: string;
}) {
  const { eggs, catalogById, pool, userId } = args;
  if (eggs.length === 0) return { count: 0, points: 0 };

  let points = 0;
  for (const e of eggs) {
    const cat = catalogById.get(e.catalog_id);
    if (!cat) continue;
    points += eggDPValue(cat, e.rarity);
  }

  const del = await supabase
    .from("user_eggs")
    .delete()
    .in("id", eggs.map((e) => e.id))
    .eq("user_id", userId);
  if (del.error) throw del.error;

  const { data: prof } = await supabase
    .from("profiles")
    .select("draco_points_total, draco_points_pool")
    .eq("id", userId)
    .single();
  if (prof) {
    await supabase
      .from("profiles")
      .update({
        draco_points_total: (prof.draco_points_total as number) + points,
        draco_points_pool: (prof.draco_points_pool as number) + points,
      })
      .eq("id", userId);
  }

  const existing = await supabase
    .from("pool_contributions")
    .select("draco_points")
    .eq("pool_id", pool.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.data) {
    await supabase
      .from("pool_contributions")
      .update({ draco_points: (existing.data.draco_points as number) + points })
      .eq("pool_id", pool.id)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("pool_contributions")
      .insert({ pool_id: pool.id, user_id: userId, draco_points: points });
  }

  return { count: eggs.length, points };
}

export async function placeNestInSlot(nestId: string, slotIndex: number, userId: string) {
  const { error } = await supabase
    .from("user_nests")
    .update({ slot_index: slotIndex })
    .eq("id", nestId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeNestFromSlot(nestId: string, userId: string) {
  await supabase.from("user_dragons").update({ placed_in_nest: null, farming_started_at: null, egg_ready: false })
    .eq("placed_in_nest", nestId).eq("user_id", userId);
  const { error } = await supabase
    .from("user_nests")
    .update({ slot_index: null })
    .eq("id", nestId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function placeDragonInNest(dragonId: string, nestId: string, userId: string) {
  const { error } = await supabase
    .from("user_dragons")
    .update({
      placed_in_nest: nestId,
      farming_started_at: new Date().toISOString(),
      egg_ready: false,
    })
    .eq("id", dragonId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeDragonFromNest(dragonId: string, userId: string) {
  const { error } = await supabase
    .from("user_dragons")
    .update({ placed_in_nest: null, farming_started_at: null, egg_ready: false })
    .eq("id", dragonId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function markEggReady(dragonId: string, userId: string) {
  const { error } = await supabase
    .from("user_dragons")
    .update({ egg_ready: true })
    .eq("id", dragonId)
    .eq("user_id", userId)
    .eq("egg_ready", false);
  if (error) throw error;
}

// Claiming a dragon: produce N eggs (of dragon's element + rarity) into inventory.
// No DP awarded here — DP comes from depositing eggs into the pool.
export async function claimDragonEggs(args: {
  dragon: DBDragon;
  nestRarity: Rarity;
  catalog: CatalogRow;
  userId: string;
}) {
  const { dragon, nestRarity, userId } = args;
  const count = EGGS_PER_NEST[nestRarity];

  const rows = Array.from({ length: count }, () => ({
    user_id: userId,
    catalog_id: dragon.catalog_id,
    rarity: dragon.rarity,
  }));
  const ins = await supabase.from("user_eggs").insert(rows);
  if (ins.error) throw ins.error;

  await supabase
    .from("user_dragons")
    .update({ placed_in_nest: null, farming_started_at: null, egg_ready: false })
    .eq("id", dragon.id)
    .eq("user_id", userId);

  return { count };
}

export async function fuseDragons(a: DBDragon, b: DBDragon, userId: string) {
  const next = nextRarity(a.rarity);
  if (!next) throw new Error("Rareza máxima alcanzada");
  if (a.catalog_id !== b.catalog_id || a.rarity !== b.rarity) throw new Error("Dragones incompatibles");
  const del = await supabase.from("user_dragons").delete().in("id", [a.id, b.id]).eq("user_id", userId);
  if (del.error) throw del.error;
  const ins = await supabase
    .from("user_dragons")
    .insert({ user_id: userId, catalog_id: a.catalog_id, rarity: next })
    .select()
    .single();
  if (ins.error) throw ins.error;
  return ins.data as DBDragon;
}

export async function fuseNests(a: DBNest, b: DBNest, userId: string) {
  if (a.rarity !== b.rarity) throw new Error("Rarezas distintas");
  const next = nextRarity(a.rarity);
  if (!next) throw new Error("Rareza máxima");
  const del = await supabase.from("user_nests").delete().in("id", [a.id, b.id]).eq("user_id", userId).is("slot_index", null);
  if (del.error) throw del.error;
  const ins = await supabase
    .from("user_nests")
    .insert({ user_id: userId, rarity: next })
    .select()
    .single();
  if (ins.error) throw ins.error;
  return ins.data as DBNest;
}

export const SLOT_COST = 500;

export async function unlockSlot(slotIndex: number, userId: string) {
  const { data: prof } = await supabase
    .from("profiles")
    .select("draco_points_total")
    .eq("id", userId)
    .single();
  const total = (prof?.draco_points_total as number | undefined) ?? 0;
  if (total < SLOT_COST) throw new Error(`Necesitas ${SLOT_COST} Draco Points`);
  await supabase
    .from("profiles")
    .update({ draco_points_total: total - SLOT_COST })
    .eq("id", userId);
  const { error } = await supabase
    .from("user_slots")
    .insert({ user_id: userId, slot_index: slotIndex });
  if (error) throw error;
}
