import { useMemo } from "react";

/** Partículas verdes flotando de abajo hacia arriba (decorativo, fijo en pantalla). */
export function Particles({ count = 28 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 5,
        duration: 12 + Math.random() * 16,
        delay: -Math.random() * 25,
        drift: (Math.random() * 2 - 1) * 60,
        opacity: 0.25 + Math.random() * 0.5,
      })),
    [count],
  );

  return (
    <div className="particles" aria-hidden="true">
      {items.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default Particles;
