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
import storm from "@/assets/dragons/storm.png";
import crystal from "@/assets/dragons/crystal.png";
import obsidian from "@/assets/dragons/obsidian.png";
import emerald from "@/assets/dragons/emerald.png";
import ruby from "@/assets/dragons/ruby.png";
import sapphire from "@/assets/dragons/sapphire.png";
import golden from "@/assets/dragons/golden.png";
import silver from "@/assets/dragons/silver.png";
import bronze from "@/assets/dragons/bronze.png";
import jade from "@/assets/dragons/jade.png";
import coral from "@/assets/dragons/coral.png";
import abyss from "@/assets/dragons/abyss.png";
import nebula from "@/assets/dragons/nebula.png";
import comet from "@/assets/dragons/comet.png";
import eclipse from "@/assets/dragons/eclipse.png";
import aurora from "@/assets/dragons/aurora.png";
import thunder from "@/assets/dragons/thunder.png";
import blaze from "@/assets/dragons/blaze.png";
import glacier from "@/assets/dragons/glacier.png";
import mist from "@/assets/dragons/mist.png";
import swamp from "@/assets/dragons/swamp.png";
import jungle from "@/assets/dragons/jungle.png";
import mountain from "@/assets/dragons/mountain.png";
import ocean from "@/assets/dragons/ocean.png";
import sky from "@/assets/dragons/sky.png";
import moon from "@/assets/dragons/moon.png";
import star from "@/assets/dragons/star.png";
import dusk from "@/assets/dragons/dusk.png";
import dawn from "@/assets/dragons/dawn.png";
import phoenix from "@/assets/dragons/phoenix.png";

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
  16: { name: "Storm Dragon", slug: "storm", image: storm },
  17: { name: "Crystal Dragon", slug: "crystal", image: crystal },
  18: { name: "Obsidian Dragon", slug: "obsidian", image: obsidian },
  19: { name: "Emerald Dragon", slug: "emerald", image: emerald },
  20: { name: "Ruby Dragon", slug: "ruby", image: ruby },
  21: { name: "Sapphire Dragon", slug: "sapphire", image: sapphire },
  22: { name: "Golden Dragon", slug: "golden", image: golden },
  23: { name: "Silver Dragon", slug: "silver", image: silver },
  24: { name: "Bronze Dragon", slug: "bronze", image: bronze },
  25: { name: "Jade Dragon", slug: "jade", image: jade },
  26: { name: "Coral Dragon", slug: "coral", image: coral },
  27: { name: "Abyss Dragon", slug: "abyss", image: abyss },
  28: { name: "Nebula Dragon", slug: "nebula", image: nebula },
  29: { name: "Comet Dragon", slug: "comet", image: comet },
  30: { name: "Eclipse Dragon", slug: "eclipse", image: eclipse },
  31: { name: "Aurora Dragon", slug: "aurora", image: aurora },
  32: { name: "Thunder Dragon", slug: "thunder", image: thunder },
  33: { name: "Blaze Dragon", slug: "blaze", image: blaze },
  34: { name: "Glacier Dragon", slug: "glacier", image: glacier },
  35: { name: "Mist Dragon", slug: "mist", image: mist },
  36: { name: "Swamp Dragon", slug: "swamp", image: swamp },
  37: { name: "Jungle Dragon", slug: "jungle", image: jungle },
  38: { name: "Mountain Dragon", slug: "mountain", image: mountain },
  39: { name: "Ocean Dragon", slug: "ocean", image: ocean },
  40: { name: "Sky Dragon", slug: "sky", image: sky },
  41: { name: "Moon Dragon", slug: "moon", image: moon },
  42: { name: "Star Dragon", slug: "star", image: star },
  43: { name: "Dusk Dragon", slug: "dusk", image: dusk },
  44: { name: "Dawn Dragon", slug: "dawn", image: dawn },
  45: { name: "Phoenix Dragon", slug: "phoenix", image: phoenix },
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
