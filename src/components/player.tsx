"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CoverArt, coverBars } from "./cover-art";
import { IconClose, IconDownload, IconPause, IconPlay, IconVolume } from "./icons";
import { formatDuration } from "@/lib/format";
import type { TrackDTO } from "@/lib/types";

type PlayerContextValue = {
  current: TrackDTO | null;
  playing: boolean;
  play: (track: TrackDTO) => void;
  toggle: () => void;
  close: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<TrackDTO | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [current]);

  const play = useCallback(
    (track: TrackDTO) => {
      if (!track.audioUrl) return;
      if (current?.id === track.id) {
        toggle();
        return;
      }
      setTime(0);
      setDuration(track.duration);
      setCurrent(track);
    },
    [current, toggle],
  );

  const close = useCallback(() => {
    audioRef.current?.pause();
    setCurrent(null);
    setPlaying(false);
    setTime(0);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    audio.src = current.audioUrl;
    audio.load();
    void audio.play().catch(() => setPlaying(false));
  }, [current]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const value = useMemo(
    () => ({ current, playing, play, toggle, close }),
    [current, playing, play, toggle, close],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setDuration(value);
        }}
        onEnded={() => setPlaying(false)}
        onError={() => setPlaying(false)}
      />
      <PlayerBar
        current={current}
        playing={playing}
        time={time}
        duration={duration || current?.duration || 0}
        volume={volume}
        onToggle={toggle}
        onClose={close}
        onVolume={setVolume}
        onSeek={(seconds) => {
          const audio = audioRef.current;
          if (audio) audio.currentTime = seconds;
          setTime(seconds);
        }}
      />
    </PlayerContext.Provider>
  );
}

function PlayerBar({
  current,
  playing,
  time,
  duration,
  volume,
  onToggle,
  onClose,
  onVolume,
  onSeek,
}: {
  current: TrackDTO | null;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
  onToggle: () => void;
  onClose: () => void;
  onVolume: (value: number) => void;
  onSeek: (seconds: number) => void;
}) {
  if (!current) return null;

  const ratio = duration > 0 ? Math.min(1, time / duration) : 0;
  const bars = coverBars(current.id, 72);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-3 py-3 sm:px-5">
        <CoverArt
          seed={current.id}
          genre={current.genre}
          className="h-12 w-12 shrink-0 rounded-xl sm:h-14 sm:w-14"
          bars={10}
          showGenre={false}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-semibold text-mist">{current.title}</p>
            <span className="shrink-0 text-[11px] tabular-nums text-mist-dim">
              {formatDuration(time)} / {formatDuration(duration)}
            </span>
          </div>
          <button
            type="button"
            aria-label="Seek"
            className="group mt-1.5 flex h-8 w-full items-end gap-[2px]"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const position = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
              onSeek(position * duration);
            }}
          >
            {bars.map((height, index) => {
              const played = index / bars.length <= ratio;
              return (
                <span
                  key={index}
                  className={`flex-1 rounded-full transition-colors ${
                    played
                      ? "bg-gradient-to-t from-ember-500 to-gold-400"
                      : "bg-white/15 group-hover:bg-white/25"
                  }`}
                  style={{ height: `${Math.max(18, height)}%` }}
                />
              );
            })}
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-ember-500 to-gold-400 text-ink-950 shadow-ember transition hover:brightness-110"
          >
            {playing ? <IconPause className="h-5 w-5" /> : <IconPlay className="h-5 w-5" />}
          </button>

          <div className="hidden items-center gap-2 pl-2 md:flex">
            <IconVolume className="h-4 w-4 text-mist-dim" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              aria-label="Volume"
              onChange={(event) => onVolume(Number(event.target.value))}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-ember-500"
            />
          </div>

          <a
            href={`/api/generations/${current.id}/download`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-mist-muted transition hover:bg-white/[0.06] hover:text-mist"
            aria-label="Download track"
          >
            <IconDownload className="h-5 w-5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
            className="flex h-10 w-10 items-center justify-center rounded-full text-mist-dim transition hover:bg-white/[0.06] hover:text-mist"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
