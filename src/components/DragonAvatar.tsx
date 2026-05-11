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
          "rounded-2xl overflow-hidden bg-card flex items-center justify-center p-1.5",
          `rarity-${rarity}`,
          sizes[size],
        )}
      >
        <img
          src={dragonImage(catalogId)}
          alt={dragonName(catalogId)}
          loading="lazy"
          width={512}
          height={512}
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>
      {ready && (
        <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-primary animate-pulse-ring" />
      )}
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-background/80 border border-border text-foreground">
        {RARITY_LABEL[rarity]}
      </span>
    </div>
  );
}
