import eggImg from "@/assets/egg.png";
import { cn } from "@/lib/utils";
import type { Rarity } from "@/lib/dragons";

export function EggVisual({
  rarity,
  className,
  size = "md",
}: {
  rarity: Rarity;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "w-12 h-12" : size === "lg" ? "w-28 h-28" : "w-20 h-20";
  return (
    <div className={cn("rounded-full overflow-hidden p-1 bg-card", `rarity-${rarity}`, dim, className)}>
      <img src={eggImg} alt="Huevo" loading="lazy" width={512} height={512} className="w-full h-full object-contain" />
    </div>
  );
}
