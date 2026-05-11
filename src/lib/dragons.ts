import ember from "@/assets/dragons/ember.png";
import aqua from "@/assets/dragons/aqua.png";
import terra from "@/assets/dragons/terra.png";
import gale from "@/assets/dragons/gale.png";
import volt from "@/assets/dragons/volt.png";
import frost from "@/assets/dragons/frost.png";
import shade from "@/assets/dragons/shade.png";
import solar from "@/assets/dragons/solar.png";
import verdant from "@/assets/dragons/verdant.png";
import stone from "@/assets/dragons/stone.png";
import tide from "@/assets/dragons/tide.png";
import sand from "@/assets/dragons/sand.png";
import magma from "@/assets/dragons/magma.png";
import cosmic from "@/assets/dragons/cosmic.png";
import voidImg from "@/assets/dragons/void.png";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Común",
  uncommon: "Poco común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
};

// Eggs produced by a dragon depending on the nest rarity it sits in
export const EGGS_PER_NEST: Record<Rarity, number> = {
  common: 2,
  uncommon: 5,
  rare: 12,
  epic: 28,
  legendary: 60,
};

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2.25,
  epic: 3.5,
  legendary: 5,
};

export function nextRarity(r: Rarity): Rarity | null {
  const i = RARITY_ORDER.indexOf(r);
  return i >= 0 && i < RARITY_ORDER.length - 1 ? RARITY_ORDER[i + 1] : null;
}

export const DRAGONS: Record<number, { name: string; slug: string; image: string }> = {
  1: { name: "Ember Dragon", slug: "ember", image: ember },
  2: { name: "Aqua Dragon", slug: "aqua", image: aqua },
  3: { name: "Terra Dragon", slug: "terra", image: terra },
  4: { name: "Gale Dragon", slug: "gale", image: gale },
  5: { name: "Volt Dragon", slug: "volt", image: volt },
  6: { name: "Frost Dragon", slug: "frost", image: frost },
  7: { name: "Shade Dragon", slug: "shade", image: shade },
  8: { name: "Solar Dragon", slug: "solar", image: solar },
  9: { name: "Verdant Dragon", slug: "verdant", image: verdant },
  10: { name: "Stone Dragon", slug: "stone", image: stone },
  11: { name: "Tide Dragon", slug: "tide", image: tide },
  12: { name: "Sand Dragon", slug: "sand", image: sand },
  13: { name: "Magma Dragon", slug: "magma", image: magma },
  14: { name: "Cosmic Dragon", slug: "cosmic", image: cosmic },
  15: { name: "Void Dragon", slug: "void", image: voidImg },
};

export function dragonImage(catalogId: number) {
  return DRAGONS[catalogId]?.image ?? ember;
}
export function dragonName(catalogId: number) {
  return DRAGONS[catalogId]?.name ?? "Unknown";
}

export function formatDuration(seconds: number) {
  if (seconds <= 0) return "Listo";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function isValidEtcAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}
