"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TrackCard } from "@/components/track-card";
import { IconLibrary, IconPlus, IconSearch } from "@/components/icons";
import { EmptyState } from "@/components/ui";
import { GENRES } from "@/lib/constants";
import { useApi } from "@/lib/use-api";
import type { TrackDTO } from "@/lib/types";

export function LibraryView() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const { data, loading, error } = useApi<{ tracks: TrackDTO[] }>(
    "/api/generations?saved=true&limit=100",
    { pollMs: 8000 },
  );

  const tracks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.tracks ?? []).filter((track) => {
      const matchesGenre = genre === "all" || track.genre === genre;
      const matchesTerm =
        !term ||
        track.title.toLowerCase().includes(term) ||
        track.prompt.toLowerCase().includes(term) ||
        track.mood.toLowerCase().includes(term);
      return matchesGenre && matchesTerm;
    });
  }, [data, search, genre]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Library</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
            Saved tracks
          </h1>
          <p className="mt-1.5 text-sm text-mist-muted">
            Everything you kept, ready to play or download.
          </p>
        </div>
        <Link href="/generate" className="btn-primary w-fit">
          <IconPlus className="h-4 w-4" />
          New track
        </Link>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-dim" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles, prompts and moods"
            className="field pl-10"
            aria-label="Search library"
          />
        </div>
        <select
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
          className="field sm:w-48"
          aria-label="Filter by genre"
        >
          <option value="all" className="bg-ink-900">
            All genres
          </option>
          {GENRES.map((item) => (
            <option key={item} value={item} className="bg-ink-900">
              {item}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="panel h-64 animate-pulse" />
          ))}
        </div>
      ) : tracks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<IconLibrary className="h-5 w-5" />}
          title={data?.tracks.length ? "No tracks match those filters" : "Your library is empty"}
          description={
            data?.tracks.length
              ? "Try a different genre or clear the search."
              : "Generated tracks land here automatically. Save the takes you want to keep."
          }
          action={
            <Link href="/generate" className="btn-primary">
              <IconPlus className="h-4 w-4" />
              Create a track
            </Link>
          }
        />
      )}
    </div>
  );
}
