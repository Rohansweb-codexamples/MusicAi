"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CoverArt } from "@/components/cover-art";
import {
  IconArrowRight,
  IconClock,
  IconDownload,
  IconPlay,
  IconRefresh,
  IconTrash,
} from "@/components/icons";
import { usePlayer } from "@/components/player";
import { Badge, EmptyState, ProgressBar, Spinner, StatusPill } from "@/components/ui";
import { apiFetch } from "@/lib/client";
import { formatDate, formatDuration } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { TrackDTO } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "done", label: "Ready" },
  { key: "rendering", label: "Rendering" },
  { key: "failed", label: "Failed" },
];

export function HistoryView() {
  const router = useRouter();
  const player = usePlayer();
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const url =
    filter === "done"
      ? "/api/generations?status=SUCCEEDED&limit=100"
      : filter === "failed"
        ? "/api/generations?status=FAILED&limit=100"
        : filter === "rendering"
          ? "/api/generations?limit=100"
          : "/api/generations?limit=100";

  const { data, loading, refresh } = useApi<{ tracks: TrackDTO[] }>(url, { pollMs: 5000 });

  const tracks = (data?.tracks ?? []).filter((track) => {
    if (filter === "rendering") {
      return track.status === "QUEUED" || track.status === "PROCESSING";
    }
    return true;
  });

  async function retry(track: TrackDTO) {
    setBusyId(track.id);
    setError(null);
    try {
      const result = await apiFetch<{ track: TrackDTO }>(`/api/generations/${track.id}/retry`, {
        method: "POST",
      });
      await refresh();
      router.push(`/tracks/${result.track.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not re-run this generation.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(track: TrackDTO) {
    if (!window.confirm(`Delete “${track.title}”? This removes the audio permanently.`)) return;
    setBusyId(track.id);
    setError(null);
    try {
      await apiFetch(`/api/generations/${track.id}`, { method: "DELETE" });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this track.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="eyebrow">History</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
          Generation history
        </h1>
        <p className="mt-1.5 text-sm text-mist-muted">
          Every brief, its settings and the rendered result — including failures.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === item.key
                ? "border-ember-500/40 bg-ember-500/15 text-ember-300"
                : "border-white/10 bg-white/[0.02] text-mist-muted hover:border-white/25"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="panel h-24 animate-pulse" />
          ))}
        </div>
      ) : tracks.length > 0 ? (
        <div className="space-y-3">
          {tracks.map((track) => {
            const rendering = track.status === "QUEUED" || track.status === "PROCESSING";
            return (
              <div key={track.id} className="panel panel-hover overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <CoverArt
                      seed={track.id}
                      genre={track.genre}
                      className="h-14 w-14 shrink-0 rounded-xl"
                      bars={10}
                      showGenre={false}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/tracks/${track.id}`}
                          className="truncate text-sm font-semibold text-mist hover:text-ember-300"
                        >
                          {track.title}
                        </Link>
                        <StatusPill status={track.status} />
                        {!track.isSaved ? <Badge tone="neutral">Not saved</Badge> : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-mist-muted">{track.prompt}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-mist-dim">
                        <span>{track.genre}</span>
                        <span>·</span>
                        <span>{track.mood}</span>
                        <span>·</span>
                        <span>{formatDuration(track.duration)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <IconClock className="h-3 w-3" /> {formatDate(track.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {track.status === "SUCCEEDED" && track.audioUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => player.play(track)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ember-500 to-gold-400 text-ink-950"
                          aria-label={`Play ${track.title}`}
                        >
                          <IconPlay className="h-4 w-4" />
                        </button>
                        <a
                          href={`/api/generations/${track.id}/download`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-mist-muted transition hover:bg-white/[0.06] hover:text-mist"
                          aria-label={`Download ${track.title}`}
                        >
                          <IconDownload className="h-4 w-4" />
                        </a>
                      </>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => retry(track)}
                      disabled={busyId === track.id || rendering}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-mist-muted transition hover:bg-white/[0.06] hover:text-mist disabled:opacity-40"
                      aria-label={`Re-run ${track.title}`}
                    >
                      {busyId === track.id ? <Spinner className="h-4 w-4" /> : <IconRefresh className="h-4 w-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(track)}
                      disabled={busyId === track.id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-mist-dim transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                      aria-label={`Delete ${track.title}`}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>

                    <Link
                      href={`/tracks/${track.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-mist-dim transition hover:bg-white/[0.06] hover:text-mist"
                      aria-label={`Open ${track.title}`}
                    >
                      <IconArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {rendering ? (
                  <div className="border-t border-white/[0.05] px-4 pb-3 pt-2">
                    <div className="flex items-center justify-between text-[11px] text-mist-muted">
                      <span className="truncate">{track.stage || "Rendering"}</span>
                      <span>{track.progress}%</span>
                    </div>
                    <ProgressBar value={track.progress} className="mt-1.5" animated />
                  </div>
                ) : null}

                {track.status === "FAILED" && track.error ? (
                  <div className="border-t border-red-500/20 bg-red-500/[0.06] px-4 py-2.5">
                    <p className="text-[11px] leading-relaxed text-red-200/90">{track.error}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<IconClock className="h-5 w-5" />}
          title="Nothing here yet"
          description={
            filter === "all"
              ? "Generations show up here the moment you start one."
              : "No generations match this filter."
          }
          action={
            <Link href="/generate" className="btn-primary">
              Start a generation
            </Link>
          }
        />
      )}
    </div>
  );
}
