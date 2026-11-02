"use client";

import Link from "next/link";
import { useState } from "react";
import { TrackCard } from "@/components/track-card";
import {
  IconArrowRight,
  IconClock,
  IconLibrary,
  IconPlus,
  IconSparkles,
  IconStar,
  IconWaveform,
} from "@/components/icons";
import { EmptyState, ProgressBar } from "@/components/ui";
import { useApi } from "@/lib/use-api";
import type { TrackDTO } from "@/lib/types";

type StatsResponse = {
  user: { name: string; email: string; role: "USER" | "ADMIN"; joinedAt: string };
  totals: { tracks: number; saved: number; active: number; minutes: number };
  topGenres: Array<{ genre: string; count: number }>;
  recent: TrackDTO[];
};

export function DashboardView() {
  const [quickPrompt, setQuickPrompt] = useState("");
  const { data, loading, error } = useApi<StatsResponse>("/api/stats", { pollMs: 6000 });

  const firstName = data?.user.name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Studio dashboard</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
            {firstName ? `Welcome back, ${firstName}` : "Welcome to the studio"}
          </h1>
          <p className="mt-1.5 text-sm text-mist-muted">
            Unlimited generations on your plan. Keep the takes that work.
          </p>
        </div>
        <Link href="/generate" className="btn-primary w-fit">
          <IconPlus className="h-4 w-4" />
          New track
        </Link>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tracks created"
          value={loading ? "—" : String(data?.totals.tracks ?? 0)}
          hint="all time"
          icon={<IconWaveform className="h-5 w-5" />}
          accent="ember"
        />
        <StatCard
          label="Saved in library"
          value={loading ? "—" : String(data?.totals.saved ?? 0)}
          hint="kept takes"
          icon={<IconStar className="h-5 w-5" />}
          accent="gold"
        />
        <StatCard
          label="Audio generated"
          value={loading ? "—" : `${data?.totals.minutes ?? 0}m`}
          hint="rendered length"
          icon={<IconClock className="h-5 w-5" />}
          accent="plum"
        />
        <StatCard
          label="Rendering now"
          value={loading ? "—" : String(data?.totals.active ?? 0)}
          hint={data?.totals.active ? "in the queue" : "queue is clear"}
          icon={<IconSparkles className="h-5 w-5" />}
          accent="neutral"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-mist-muted">
              Recent generations
            </h2>
            <Link href="/history" className="link-quiet inline-flex items-center gap-1">
              History <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="panel h-64 animate-pulse" />
              ))}
            </div>
          ) : data && data.recent.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.recent.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconWaveform className="h-5 w-5" />}
              title="No tracks yet"
              description="Describe the music you want and the studio will render the first take in a couple of minutes."
              action={
                <Link href="/generate" className="btn-primary">
                  <IconPlus className="h-4 w-4" />
                  Create your first track
                </Link>
              }
            />
          )}
        </section>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="text-sm font-semibold text-mist">Quick start</p>
            <p className="mt-1 text-xs text-mist-muted">
              Sketch an idea here, then refine it in the studio.
            </p>
            <textarea
              value={quickPrompt}
              onChange={(event) => setQuickPrompt(event.target.value)}
              rows={3}
              placeholder="A slow, warm synthwave track with a nostalgic lead…"
              className="field mt-3 resize-none"
            />
            <Link
              href={
                quickPrompt.trim()
                  ? `/generate?prompt=${encodeURIComponent(quickPrompt.trim())}`
                  : "/generate"
              }
              className="btn-primary mt-3 w-full justify-center"
            >
              Open in studio
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="panel p-5">
            <p className="text-sm font-semibold text-mist">Studio plan</p>
            <div className="mt-3 space-y-2.5 text-xs text-mist-muted">
              <div className="flex items-center justify-between">
                <span>Generations</span>
                <span className="font-semibold text-gold-300">Unlimited</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Concurrent renders</span>
                <span className="text-mist">{data?.totals.active ?? 0} active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Format</span>
                <span className="text-mist">MP3 / WAV</span>
              </div>
            </div>
            {data?.totals.active ? (
              <div className="mt-4">
                <p className="text-[11px] text-mist-dim">Renders in progress</p>
                <ProgressBar value={65} className="mt-2" animated />
              </div>
            ) : null}
          </div>

          {data && data.topGenres.length > 0 ? (
            <div className="panel p-5">
              <p className="text-sm font-semibold text-mist">Your sound</p>
              <div className="mt-3 space-y-2.5">
                {data.topGenres.map((item) => {
                  const max = data.topGenres[0].count || 1;
                  return (
                    <div key={item.genre}>
                      <div className="flex items-center justify-between text-[11px] text-mist-muted">
                        <span>{item.genre}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-plum-500 to-ember-500"
                          style={{ width: `${Math.round((item.count / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="panel p-5">
            <p className="text-sm font-semibold text-mist">Where your tracks live</p>
            <p className="mt-1.5 text-xs leading-relaxed text-mist-muted">
              Audio is stored privately. Playback and downloads are served through your account, so
              nobody else can open your files.
            </p>
            <Link href="/library" className="btn-ghost mt-3 w-full justify-center">
              <IconLibrary className="h-4 w-4" />
              Open library
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent: "ember" | "gold" | "plum" | "neutral";
}) {
  const accents: Record<string, string> = {
    ember: "text-ember-400 bg-ember-500/10 border-ember-500/25",
    gold: "text-gold-300 bg-gold-400/10 border-gold-400/25",
    plum: "text-plum-300 bg-plum-500/10 border-plum-500/25",
    neutral: "text-mist-muted bg-white/[0.04] border-white/10",
  };

  return (
    <div className="panel panel-hover p-4">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${accents[accent]}`}>
          {icon}
        </span>
        <span className="text-[11px] uppercase tracking-[0.14em] text-mist-dim">{hint}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-mist">{value}</p>
      <p className="mt-0.5 text-xs text-mist-muted">{label}</p>
    </div>
  );
}
