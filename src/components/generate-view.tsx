"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import {
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconPause,
  IconPlay,
  IconRefresh,
  IconSparkles,
  IconWaveform,
} from "@/components/icons";
import { usePlayer } from "@/components/player";
import { Badge, ProgressBar, Spinner, StatusPill } from "@/components/ui";
import { apiFetch } from "@/lib/client";
import { DURATIONS, GENRES, MAX_TEMPO, MIN_TEMPO, MOODS } from "@/lib/constants";
import { formatDuration, timeAgo } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { GenerationMode, TrackDTO } from "@/lib/types";

const MODES: Array<{ value: GenerationMode; label: string; hint: string }> = [
  { value: "TEXT_TO_MUSIC", label: "Text to music", hint: "Full production from a description" },
  { value: "SONG_WITH_VOCALS", label: "Song with vocals", hint: "Lyrics performed over the track" },
  { value: "INSTRUMENTAL", label: "Instrumental", hint: "No vocals — beats and beds" },
];

const DURATION_LABELS: Record<number, string> = {
  30: "30 sec",
  60: "1 min",
  90: "1:30",
  120: "2 min",
};

export function GenerateView({ initialPrompt = "" }: { initialPrompt?: string }) {
  const player = usePlayer();
  const [mode, setMode] = useState<GenerationMode>("TEXT_TO_MUSIC");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [lyrics, setLyrics] = useState("");
  const [genre, setGenre] = useState<string>("Electronic");
  const [mood, setMood] = useState<string>("Uplifting");
  const [tempoEnabled, setTempoEnabled] = useState(false);
  const [tempo, setTempo] = useState(110);
  const [duration, setDuration] = useState<number>(60);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writingLyrics, setWritingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useApi<{ track: TrackDTO }>(
    activeId ? `/api/generations/${activeId}` : null,
    { pollMs: 2500 },
  );
  const sessions = useApi<{ tracks: TrackDTO[] }>("/api/generations?limit=6", { pollMs: 5000 });

  const track = active.data?.track ?? null;
  const rendering = track?.status === "QUEUED" || track?.status === "PROCESSING";

  const promptReady = prompt.trim().length >= 6;

  const lyricPlaceholder = useMemo(
    () =>
      mode === "SONG_WITH_VOCALS"
        ? "[verse]\nStreetlights hum a quiet tune\nWe trade the night for something new"
        : "Lyrics are optional here — write them or let the AI draft them.",
    [mode],
  );

  async function writeLyrics() {
    setLyricsError(null);
    if (!promptReady) {
      setLyricsError("Describe the song first so the writer has something to work with.");
      return;
    }
    setWritingLyrics(true);
    try {
      const result = await apiFetch<{ lyrics: string }>("/api/lyrics", {
        method: "POST",
        body: JSON.stringify({ prompt, genre, mood }),
      });
      setLyrics(result.lyrics);
      if (mode === "INSTRUMENTAL") setMode("SONG_WITH_VOCALS");
    } catch (cause) {
      setLyricsError(cause instanceof Error ? cause.message : "Could not write lyrics.");
    } finally {
      setWritingLyrics(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!promptReady) {
      setError("Describe the music in at least a few words.");
      return;
    }
    if (mode === "SONG_WITH_VOCALS" && !lyrics.trim()) {
      setError("Add lyrics — or use the AI lyrics writer — to generate a vocal song.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<{ track: TrackDTO }>("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          mode,
          prompt: prompt.trim(),
          lyrics: lyrics.trim() || null,
          genre,
          mood,
          tempo: tempoEnabled ? tempo : null,
          duration,
        }),
      });
      setActiveId(result.track.id);
      await sessions.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the generation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="eyebrow">Create</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
          Brief a new track
        </h1>
        <p className="mt-1.5 text-sm text-mist-muted">
          Set the intent, describe the sound and render. Every take is saved to your history.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={submit} className="space-y-5">
          <div className="panel p-5">
            <p className="label">Intent</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map((item) => {
                const activeMode = mode === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      activeMode
                        ? "border-ember-500/50 bg-gradient-to-br from-ember-500/15 to-plum-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/25"
                    }`}
                  >
                    <span
                      className={`flex items-center gap-1.5 text-sm font-semibold ${
                        activeMode ? "text-mist" : "text-mist-muted"
                      }`}
                    >
                      {activeMode ? <IconCheck className="h-3.5 w-3.5 text-ember-400" /> : null}
                      {item.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-mist-dim">
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel p-5">
            <p className="label">Brief</p>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Dreamy synthwave with a warm analog bass, shimmering arpeggios and a nostalgic lead melody…"
              className="field resize-none"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-mist-dim">
              <span>Genre, mood, tempo and length are applied on top of this.</span>
              <span>{prompt.length}/600</span>
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label mb-0">Lyrics</p>
                <p className="mt-1 text-[11px] text-mist-dim">
                  Required for vocal songs. Use [verse], [chorus] and [bridge] tags.
                </p>
              </div>
              <button
                type="button"
                onClick={writeLyrics}
                disabled={writingLyrics}
                className="btn-ghost shrink-0 px-3 py-1.5 text-xs"
              >
                {writingLyrics ? <Spinner /> : <IconSparkles className="h-3.5 w-3.5" />}
                AI writer
              </button>
            </div>
            <textarea
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              rows={6}
              maxLength={4000}
              placeholder={lyricPlaceholder}
              className="field mt-3 resize-none font-mono text-[13px] leading-relaxed"
            />
            {lyricsError ? (
              <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                {lyricsError}
              </p>
            ) : null}
          </div>

          <div className="panel space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="genre">
                  Genre
                </label>
                <select
                  id="genre"
                  className="field"
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                >
                  {GENRES.map((item) => (
                    <option key={item} value={item} className="bg-ink-900">
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="mood">
                  Mood
                </label>
                <select
                  id="mood"
                  className="field"
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                >
                  {MOODS.map((item) => (
                    <option key={item} value={item} className="bg-ink-900">
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="label mb-0">Tempo</p>
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-mist-muted">
                  <input
                    type="checkbox"
                    checked={tempoEnabled}
                    onChange={(event) => setTempoEnabled(event.target.checked)}
                    className="h-3.5 w-3.5 accent-ember-500"
                  />
                  Set tempo
                </label>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <input
                  type="range"
                  min={MIN_TEMPO}
                  max={MAX_TEMPO}
                  step={1}
                  value={tempo}
                  disabled={!tempoEnabled}
                  onChange={(event) => setTempo(Number(event.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-ember-500 disabled:opacity-40"
                />
                <span className="w-16 text-right text-sm tabular-nums text-mist">{tempo} BPM</span>
              </div>
            </div>

            <div>
              <p className="label">Length</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDuration(value)}
                    className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                      duration === value
                        ? "border-gold-400/50 bg-gold-400/15 text-gold-300"
                        : "border-white/10 bg-white/[0.02] text-mist-muted hover:border-white/25"
                    }`}
                  >
                    {DURATION_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full justify-center py-3" disabled={submitting}>
            {submitting ? <Spinner /> : <IconSparkles className="h-4 w-4" />}
            {submitting ? "Starting session…" : "Generate track"}
          </button>
        </form>

        <aside className="space-y-5">
          <div className="panel overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <p className="text-sm font-semibold text-mist">This session</p>
            </div>

            {!track ? (
              <div className="px-5 py-8 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-plum-300">
                  <IconWaveform className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm text-mist-muted">
                  Nothing rendering yet. Set your brief and hit generate.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <div className="flex gap-3">
                  <CoverArt
                    seed={track.id}
                    genre={track.genre}
                    className="h-16 w-16 shrink-0 rounded-xl"
                    bars={10}
                    showGenre={false}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-mist">{track.title}</p>
                      <StatusPill status={track.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-mist-dim">
                      {track.genre} · {track.mood} · {formatDuration(track.duration)}
                    </p>
                  </div>
                </div>

                {rendering ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-mist-muted">
                      <span className="truncate">{track.stage || "Rendering"}</span>
                      <span>{track.progress}%</span>
                    </div>
                    <ProgressBar value={track.progress} className="mt-2" animated />
                    <p className="mt-3 text-[11px] leading-relaxed text-mist-dim">
                      Rendering happens on the server. You can keep this tab open — it updates live.
                    </p>
                  </div>
                ) : null}

                {track.status === "FAILED" ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3">
                    <p className="text-xs font-semibold text-red-200">Generation failed</p>
                    <p className="mt-1 text-xs leading-relaxed text-red-200/80">{track.error}</p>
                  </div>
                ) : null}

                {track.status === "SUCCEEDED" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => player.play(track)}
                      className="btn-primary flex-1 justify-center"
                    >
                      {player.current?.id === track.id && player.playing ? (
                        <IconPause className="h-4 w-4" />
                      ) : (
                        <IconPlay className="h-4 w-4" />
                      )}
                      {player.current?.id === track.id && player.playing ? "Pause" : "Play"}
                    </button>
                    <a
                      href={`/api/generations/${track.id}/download`}
                      className="btn-ghost"
                      aria-label="Download track"
                    >
                      <IconDownload className="h-4 w-4" />
                    </a>
                  </div>
                ) : null}

                <Link
                  href={`/tracks/${track.id}`}
                  className="link-quiet inline-flex items-center gap-1"
                >
                  Open track page <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-mist">Recent sessions</p>
              <Link href="/history" className="link-quiet inline-flex items-center gap-1 text-xs">
                All <IconArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-3 space-y-2">
              {sessions.data?.tracks.length ? (
                sessions.data.tracks.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/tracks/${item.id}`}
                    className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/[0.03]"
                  >
                    <CoverArt
                      seed={item.id}
                      genre={item.genre}
                      className="h-9 w-9 shrink-0 rounded-lg"
                      bars={8}
                      showGenre={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-mist">{item.title}</p>
                      <p className="truncate text-[11px] text-mist-dim">
                        {item.genre} · {timeAgo(item.createdAt)}
                      </p>
                    </div>
                    {item.status === "SUCCEEDED" ? (
                      <button
                        type="button"
                        aria-label={`Play ${item.title}`}
                        onClick={(event) => {
                          event.preventDefault();
                          player.play(item);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-mist-muted transition hover:bg-white/[0.06] hover:text-mist"
                      >
                        <IconPlay className="h-3.5 w-3.5" />
                      </button>
                    ) : item.status === "FAILED" ? (
                      <Badge tone="danger">Failed</Badge>
                    ) : (
                      <Spinner className="h-3.5 w-3.5" />
                    )}
                  </Link>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-mist-dim">No sessions yet.</p>
              )}
            </div>
          </div>

          <div className="panel p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-mist">
              <IconRefresh className="h-4 w-4 text-plum-300" /> Pro tips
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-mist-muted">
              <li>Name instruments and textures — “warm analog bass”, “brushed drums”.</li>
              <li>Keep vocal lyrics to 6–10 syllables per line for a tighter performance.</li>
              <li>Short takes render fastest; build a full arrangement by layering sections.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
