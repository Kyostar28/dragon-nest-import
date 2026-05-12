import { RARITY_MULTIPLIER, type Rarity } from "@/lib/dragons";

export type DragonElement =
  | "fire" | "water" | "earth" | "air" | "light"
  | "dark" | "nature" | "arcane" | "ice" | "thunder";

export const ELEMENT_LABEL: Record<DragonElement, string> = {
  fire: "Fuego", water: "Agua", earth: "Tierra", air: "Aire", light: "Luz",
  dark: "Oscuridad", nature: "Naturaleza", arcane: "Arcano", ice: "Hielo", thunder: "Trueno",
};

export const ELEMENT_ICON: Record<DragonElement, string> = {
  fire: "🔥", water: "💧", earth: "🪨", air: "🌪️", light: "✨",
  dark: "🌑", nature: "🌿", arcane: "🔮", ice: "❄️", thunder: "⚡",
};

export const ELEMENT_COLOR: Record<DragonElement, string> = {
  fire: "text-orange-400", water: "text-blue-400", earth: "text-amber-700",
  air: "text-sky-300", light: "text-yellow-300", dark: "text-purple-400",
  nature: "text-green-400", arcane: "text-fuchsia-400", ice: "text-cyan-300",
  thunder: "text-yellow-400",
};

export type DragonCatalog = {
  id: number;
  element: DragonElement;
  base_hp: number;
  base_ap: number;
  base_defense: number;
  base_crit: number;
};

export type DragonStats = {
  hp: number;
  ap: number;
  defense: number;
  crit: number;
  attack: number;
};

/** Compute final stats from base + level + rarity. */
export function computeStats(
  cat: { base_hp: number; base_ap: number; base_defense: number; base_crit: number },
  rarity: Rarity,
  level: number,
): DragonStats {
  const mult = RARITY_MULTIPLIER[rarity];
  const lvl = Math.max(1, level);
  return {
    hp: Math.round((cat.base_hp + (lvl - 1) * 18) * mult),
    ap: Math.min(12, cat.base_ap + Math.floor((lvl - 1) / 5)),
    defense: Math.round((cat.base_defense + (lvl - 1) * 2) * mult),
    crit: Math.min(60, cat.base_crit + Math.floor((lvl - 1) / 2)),
    attack: Math.round((10 + (lvl - 1) * 3) * mult),
  };
}

/** XP required to reach (level + 1). */
export function xpForNext(level: number) {
  return level * level * 100;
}

export const MAX_LEVEL = 50;
