const PALETTES: Array<[number, number]> = [
  [24, 276],
  [276, 46],
  [46, 18],
  [300, 38],
  [268, 24],
  [210, 286],
];

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function coverColors(seed: string) {
  const hash = hashString(seed || "music-ai");
  const [a, b] = PALETTES[hash % PALETTES.length];
  return { a, b, hash };
}

/** Deterministic pseudo-random sequence so artwork is stable per track. */
function sequence(hash: number, index: number) {
  const value = Math.sin(hash * 0.0001 + index * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function coverBars(seed: string, count = 28) {
  const { hash } = coverColors(seed);
  return Array.from({ length: count }, (_, index) => 16 + Math.round(sequence(hash, index) * 74));
}

type CoverArtProps = {
  seed: string;
  genre?: string;
  className?: string;
  bars?: number;
  showGenre?: boolean;
  children?: React.ReactNode;
};

/** Generated studio artwork — no external images, stable per track. */
export function CoverArt({
  seed,
  genre,
  className = "",
  bars = 28,
  showGenre = true,
  children,
}: CoverArtProps) {
  const { a, b } = coverColors(seed);
  const heights = coverBars(seed, bars);

  return (
    <div
      className={`relative isolate overflow-hidden bg-ink-900 ${className}`}
      style={{ backgroundImage: `linear-gradient(145deg, hsl(${a} 72% 9%), hsl(${b} 62% 17%))` }}
    >
      <div
        className="absolute -left-10 -top-12 h-40 w-40 rounded-full opacity-80 blur-3xl"
        style={{ background: `hsl(${a} 96% 58% / 0.55)` }}
      />
      <div
        className="absolute -bottom-12 right-[-12%] h-44 w-44 rounded-full opacity-80 blur-3xl"
        style={{ background: `hsl(${b} 92% 62% / 0.45)` }}
      />
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-soft-light"
        style={{
          backgroundImage:
            "repeating-linear-gradient(112deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 13px)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 flex h-1/2 items-end gap-[2px] px-3 pb-3 opacity-60">
        {heights.map((height, index) => (
          <span
            key={index}
            className="flex-1 rounded-full bg-white/70"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      {showGenre && genre ? (
        <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur">
          {genre}
        </span>
      ) : null}
      {children}
    </div>
  );
}
