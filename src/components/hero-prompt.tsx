"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconArrowRight, IconSparkles } from "./icons";

const IDEAS = [
  "Warm lo-fi beat for a rainy night",
  "Cinematic trailer with heavy brass",
  "Afrobeats summer hit with bright guitars",
];

export function HeroPrompt({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go(idea?: string) {
    const brief = (idea ?? value).trim();
    if (!brief) return;
    const path = loggedIn ? "/generate" : "/register";
    router.push(`${path}?prompt=${encodeURIComponent(brief)}`);
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          go();
        }}
        className="panel flex flex-col gap-2 p-2 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center gap-2 px-2">
          <IconSparkles className="h-4 w-4 shrink-0 text-ember-400" />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="A warm lo-fi beat with vinyl crackle and mellow piano…"
            aria-label="Describe the music you want"
            className="w-full bg-transparent py-2.5 text-sm text-mist outline-none placeholder:text-mist-dim"
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          Generate
          <IconArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => {
              setValue(idea);
              go(idea);
            }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-mist-muted transition hover:border-white/25 hover:text-mist"
          >
            {idea}
          </button>
        ))}
      </div>
    </div>
  );
}
