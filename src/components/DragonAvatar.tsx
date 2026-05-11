import type { Rarity } from "@/lib/dragons";
import { RARITY_LABEL, dragonImage, dragonName } from "@/lib/dragons";
import { cn } from "@/lib/utils";

type Props = {
  catalogId: number;
  rarity: Rarity;
  size?: "sm" | "md" | "lg";
  className?: string;
  ready?: boolean;
};

const sizes = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-36 h-36",
};

export function DragonAvatar({ catalogId, rarity, size = "md", className, ready }: Props) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-card flex items-center justify-center",
          `rarity-${rarity}`,
          sizes[size],
        )}
      >
        <img
          src={dragonImage(catalogId)}
          alt={dragonName(catalogId)}
          loading="lazy"
          width={1024}
          height={1024}
          className="w-full h-full object-cover"
        />
      </div>
      {ready && (
        <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-primary animate-pulse-ring" />
      )}
      <span className={cn(
        "absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/90 border font-display whitespace-nowrap",
        `border-rarity-${rarity} text-rarity-${rarity}`,
      )} style={{ borderColor: `var(--rarity-${rarity})`, color: `var(--rarity-${rarity})` }}>
        {RARITY_LABEL[rarity]}
      </span>
    </div>
  );
}
