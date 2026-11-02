"use client";

import Link from "next/link";
import { usePlayer } from "./player";
import { CoverArt } from "./cover-art";
import { IconPause, IconPlay, IconStar } from "./icons";
import { Equalizer, ProgressBar, StatusPill } from "./ui";
import { formatDuration, timeAgo } from "@/lib/format";
import type { TrackDTO } from "@/lib/types";

export function TrackCard({ track }: { track: TrackDTO }) {
  const player = usePlayer();
  const isCurrent = player.current?.id === track.id;
  const isPlaying = isCurrent && player.playing;
  const rendering = track.status === "QUEUED" || track.status === "PROCESSING";

  return (
    <Link
      href={`/tracks/${track.id}`}
      className="panel panel-hover group relative block overflow-hidden"
    >
      <div className="relative">
        <CoverArt
          seed={track.id}
          genre={track.genre}
          className="aspect-square w-full"
          bars={30}
          showGenre={false}
        />

        <div className="absolute right-3 top-3">
          <StatusPill status={track.status} />
        </div>

        {track.status === "SUCCEEDED" && track.audioUrl ? (
          <button
            type="button"
            aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            onClick={(event) => {
              event.preventDefault();
              player.play(track);
            }}
            className="absolute bottom-3 right-3 flex h-11 w-11 translate-y-1 items-center justify-center rounded-full bg-gradient-to-br from-ember-500 to-gold-400 text-ink-950 opacity-0 shadow-ember transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
          >
            {isPlaying ? <IconPause className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
          </button>
        ) : null}

        {isPlaying ? (
          <span className="absolute bottom-4 left-4 text-gold-300">
            <Equalizer />
          </span>
        ) : null}

        {rendering ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent px-4 pb-3 pt-8">
            <div className="flex items-center justify-between text-[11px] font-medium text-mist-muted">
              <span className="truncate">{track.stage || "Rendering"}</span>
              <span>{track.progress}%</span>
            </div>
            <ProgressBar value={track.progress} className="mt-2" animated />
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-mist">{track.title}</p>
          {track.isSaved ? <IconStar className="h-3.5 w-3.5 shrink-0 text-gold-400" /> : null}
        </div>
        <p className="mt-1 truncate text-xs text-mist-dim">
          {track.genre} · {track.mood} · {formatDuration(track.duration)}
        </p>
        <p className="mt-0.5 text-[11px] text-mist-dim/70">{timeAgo(track.createdAt)}</p>
      </div>
    </Link>
  );
}
