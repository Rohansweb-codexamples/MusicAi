import type { GenerationStatus } from "@/lib/types";

const STATUS_STYLES: Record<GenerationStatus, { label: string; className: string; dot: string }> =
  {
    QUEUED: {
      label: "Queued",
      className: "border-white/15 bg-white/[0.06] text-mist-muted",
      dot: "bg-mist-dim",
    },
    PROCESSING: {
      label: "Rendering",
      className: "border-plum-500/40 bg-plum-500/15 text-plum-300",
      dot: "bg-plum-400 animate-pulse",
    },
    SUCCEEDED: {
      label: "Ready",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
      dot: "bg-emerald-400",
    },
    FAILED: {
      label: "Failed",
      className: "border-red-400/30 bg-red-500/10 text-red-200",
      dot: "bg-red-400",
    },
    CANCELED: {
      label: "Canceled",
      className: "border-white/10 bg-white/[0.04] text-mist-dim",
      dot: "bg-mist-dim",
    },
  };

export function StatusPill({
  status,
  className = "",
}: {
  status: GenerationStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.QUEUED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.className} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ember" | "plum" | "gold" | "success" | "danger";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-white/12 bg-white/[0.04] text-mist-muted",
    ember: "border-ember-500/35 bg-ember-500/12 text-ember-400",
    plum: "border-plum-500/35 bg-plum-500/12 text-plum-300",
    gold: "border-gold-400/35 bg-gold-400/12 text-gold-300",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    danger: "border-red-400/30 bg-red-500/10 text-red-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-white/25 border-t-white ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProgressBar({
  value,
  className = "",
  animated = false,
}: {
  value: number;
  className?: string;
  animated?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-ember-500 via-gold-400 to-plum-400 transition-all duration-700"
        style={{ width: `${clamped}%` }}
      />
      {animated ? (
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
      ) : null}
    </div>
  );
}

export function Equalizer({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex h-4 items-end gap-[3px] ${className}`} aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className="w-[3px] origin-bottom rounded-full bg-current animate-eq"
          style={{ height: "100%", animationDelay: `${index * 140}ms` }}
        />
      ))}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-plum-300">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold text-mist">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-mist-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
