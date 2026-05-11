import nestImg from "@/assets/nest.png";
import { cn } from "@/lib/utils";
import type { Rarity } from "@/lib/dragons";
import { EGGS_PER_NEST, RARITY_LABEL } from "@/lib/dragons";

export function NestVisual({
  rarity,
  size = "md",
  className,
}: {
  rarity: Rarity;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? "w-16 h-16" : size === "lg" ? "w-36 h-36" : "w-24 h-24";
  return (
    <div className={cn("relative", className)}>
      <div className={cn("rounded-full overflow-hidden p-1.5 bg-card", `rarity-${rarity}`, dim)}>
        <img
          src={nestImg}
          alt={`Nido ${RARITY_LABEL[rarity]}`}
          loading="lazy"
          width={512}
          height={512}
          className="w-full h-full object-contain"
        />
      </div>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-background/80 border border-border whitespace-nowrap">
        {RARITY_LABEL[rarity]} · {EGGS_PER_NEST[rarity]}🥚
      </span>
    </div>
  );
}
