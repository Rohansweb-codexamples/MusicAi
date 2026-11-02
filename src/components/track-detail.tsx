"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import {
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconPause,
  IconPlay,
  IconRefresh,
  IconStar,
  IconTrash,
} from "@/components/icons";
import { usePlayer } from "@/components/player";
import { Badge, ProgressBar, Spinner, StatusPill } from "@/components/ui";
import { apiFetch } from "@/lib/client";
import { MODE_LABELS } from "@/lib/constants";
import { formatBytes, formatDate, formatDuration } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { TrackDTO } from "@/lib/types";

export function TrackDetail({ id }: { id: string }) {
  const router = useRouter();
  const player = usePlayer();
  const { data, error, refresh } = useApi<{ track: TrackDTO }>(`/api/generations/${id}`, {
    pollMs: 2500,
  });

  const track = data?.track ?? null;
  const rendering = track?.status === "QUEUED" || track?.status === "PROCESSING";

  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (track) setTitle(track.title);
  }, [track?.id, track?.title]);

  async function patch(body: { title?: string; isSaved?: boolean }) {
    setBusy(true);
    setActionError(null);
    try {
      await apiFetch<{ track: TrackDTO }>(`/api/generations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not update this track.");
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    setBusy(true);
    setActionError(null);
    try {
      const result = await apiFetch<{ track: TrackDTO }>(`/api/generations/${id}/retry`, {
        method: "POST",
      });
      router.push(`/tracks/${result.track.id}`);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not re-run this track.");
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this track and its audio permanently?")) return;
    setBusy(true);
    try {
      await apiFetch(`/api/generations/${id}`, { method: "DELETE" });
      router.push("/library");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not delete this track.");
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="panel p-8 text-center">
          <p className="text-sm text-red-200">{error}</p>
          <Link href="/history" className="btn-ghost mt-4">
            Back to history
          </Link>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="panel h-72 animate-pulse" />
        <div className="panel h-40 animate-pulse" />
      </div>
    );
  }

  const isPlaying = player.current?.id === track.id && player.playing;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/history" className="link-quiet inline-flex items-center gap-1.5">
        <IconArrowRight className="h-3.5 w-3.5 rotate-180" />
        Back to history
      </Link>

      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-6 p-5 sm:flex-row">
          <CoverArt
            seed={track.id}
            genre={track.genre}
            className="aspect-square w-full shrink-0 rounded-2xl sm:h-52 sm:w-52"
            bars={26}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={track.status} />
              <Badge tone="plum">{MODE_LABELS[track.mode]}</Badge>
              {track.isSaved ? (
                <Badge tone="gold">
                  <IconStar className="h-3 w-3" /> Saved
                </Badge>
              ) : null}
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => {
                const trimmed = title.trim();
                if (trimmed && trimmed !== track.title) void patch({ title: trimmed });
                else setTitle(track.title);
              }}
              className="mt-3 w-full border-b border-transparent bg-transparent text-2xl font-bold tracking-tight text-mist outline-none transition hover:border-white/10 focus:border-plum-500/60"
              aria-label="Track title"
            />

            <p className="mt-1 text-xs text-mist-dim">
              {track.genre} · {track.mood} · {formatDuration(track.duration)}
              {track.tempo ? ` · ${track.tempo} BPM` : ""} · {formatDate(track.createdAt)}
            </p>

            {rendering ? (
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] text-mist-muted">
                  <span className="truncate">{track.stage || "Rendering"}</span>
                  <span>{track.progress}%</span>
                </div>
                <ProgressBar value={track.progress} className="mt-2" animated />
              </div>
            ) : null}

            {track.status === "FAILED" && track.error ? (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-xs font-semibold text-red-200">This generation failed</p>
                <p className="mt-1 text-xs leading-relaxed text-red-200/80">{track.error}</p>
              </div>
            ) : null}

            {actionError ? (
              <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-200">
                {actionError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {track.status === "SUCCEEDED" && track.audioUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => player.play(track)}
                    className="btn-primary"
                  >
                    {isPlaying ? <IconPause className="h-4 w-4" /> : <IconPlay className="h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                  <a href={`/api/generations/${track.id}/download`} className="btn-ghost">
                    <IconDownload className="h-4 w-4" />
                    Download
                  </a>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => patch({ isSaved: !track.isSaved })}
                disabled={busy}
                className="btn-ghost"
              >
                {track.isSaved ? <IconCheck className="h-4 w-4" /> : <IconStar className="h-4 w-4" />}
                {track.isSaved ? "In library" : "Save to library"}
              </button>

              <button type="button" onClick={retry} disabled={busy || rendering} className="btn-ghost">
                {busy ? <Spinner /> : <IconRefresh className="h-4 w-4" />}
                Re-run
              </button>

              <button type="button" onClick={remove} disabled={busy} className="btn-danger">
                <IconTrash className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="text-sm font-semibold text-mist">Brief</p>
          <p className="mt-2 text-sm leading-relaxed text-mist-muted">{track.prompt}</p>
        </div>

        <div className="panel p-5">
          <p className="text-sm font-semibold text-mist">Lyrics</p>
          {track.lyrics ? (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-mist-muted">
              {track.lyrics}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-mist-dim">Instrumental — no lyrics on this track.</p>
          )}
        </div>
      </div>

      <div className="panel p-5">
        <p className="text-sm font-semibold text-mist">Session details</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Mode" value={MODE_LABELS[track.mode]} />
          <Detail label="Length" value={formatDuration(track.duration)} />
          <Detail label="File size" value={formatBytes(track.audioBytes)} />
          <Detail
            label="Completed"
            value={track.completedAt ? formatDate(track.completedAt) : "—"}
          />
          <Detail label="Provider" value={track.provider ?? "—"} />
          <Detail label="Model" value={track.providerModel ?? "—"} />
          <Detail label="Created" value={formatDate(track.createdAt)} />
          <Detail label="Track ID" value={track.id.slice(0, 10)} />
        </dl>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-mist-dim">{label}</dt>
      <dd className="mt-1 truncate text-sm text-mist">{value}</dd>
    </div>
  );
}
