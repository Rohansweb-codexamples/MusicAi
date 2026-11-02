import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { CoverArt } from "@/components/cover-art";
import { HeroPrompt } from "@/components/hero-prompt";
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconDownload,
  IconLibrary,
  IconShield,
  IconSparkles,
  IconWaveform,
} from "@/components/icons";
import { Badge } from "@/components/ui";

const FEATURES = [
  {
    icon: IconSparkles,
    title: "Text to music",
    body: "Describe a scene, a feeling or a reference and get a finished track back in minutes.",
  },
  {
    icon: IconWaveform,
    title: "Songs with vocals",
    body: "Write or generate lyrics, pick a genre and let the model perform the full song.",
  },
  {
    icon: IconLibrary,
    title: "Instrumentals",
    body: "Beat-driven or orchestral beds for videos, games and sessions — no vocals, no fuss.",
  },
  {
    icon: IconClock,
    title: "Every take saved",
    body: "Full generation history with parameters, so you can revisit and re-run any idea.",
  },
  {
    icon: IconDownload,
    title: "Download masters",
    body: "Grab the rendered audio straight from your library and take it into your DAW.",
  },
  {
    icon: IconShield,
    title: "Private by default",
    body: "Tracks live in your account only. Provider keys stay on the server, never in the browser.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Brief the studio",
    body: "Type a prompt and set the genre, mood, tempo and length.",
  },
  {
    step: "02",
    title: "Render the track",
    body: "Our server queues the generation and streams live progress back to you.",
  },
  {
    step: "03",
    title: "Keep what works",
    body: "Play it, save it to your library, download the file, re-run with a tweak.",
  },
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="relative overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ember-500 to-plum-500 text-ink-950">
              <IconWaveform className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.22em] text-mist">Music AI</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-6 text-sm text-mist-muted md:flex">
            <a href="#features" className="transition hover:text-mist">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-mist">
              Workflow
            </a>
            <a href="#controls" className="transition hover:text-mist">
              Studio
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Open studio
                <IconArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary">
                  Start creating
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <Badge tone="ember">
            <span className="h-1.5 w-1.5 rounded-full bg-ember-400" />
            Real AI audio · vocals and instrumentals
          </Badge>

          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-mist sm:text-5xl lg:text-6xl">
            Describe it.
            <br />
            <span className="gradient-text">Hear it.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-mist-muted">
            Music AI turns a sentence into a finished track — full songs with vocals, instrumental
            beds, and beats you can download. Built like a studio: brief, render, keep the take.
          </p>

          <div className="mt-8 max-w-xl">
            <HeroPrompt loggedIn={Boolean(user)} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-mist-muted">
            <span className="inline-flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-gold-400" /> Unlimited generations
            </span>
            <span className="inline-flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-gold-400" /> Full songs with vocals
            </span>
            <span className="inline-flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-gold-400" /> Private library
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-10 rounded-full bg-plum-600/25 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-4">
            <div className="animate-float">
              <CoverArt seed="neon-skyline" genre="Electronic" className="aspect-square rounded-2xl shadow-glow" />
            </div>
            <div className="mt-8 animate-float [animation-delay:1.4s]">
              <CoverArt seed="midnight-strings" genre="Cinematic" className="aspect-square rounded-2xl" />
            </div>
            <div className="-mt-2 animate-float [animation-delay:2.6s]">
              <CoverArt seed="golden-hour" genre="Lo-Fi" className="aspect-square rounded-2xl" />
            </div>
            <div className="mt-6 animate-float [animation-delay:0.8s]">
              <CoverArt seed="violet-room" genre="R&B" className="aspect-square rounded-2xl" />
            </div>
          </div>

          <div className="panel mt-6 flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ember-500 to-gold-400 text-ink-950">
              <IconWaveform className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-mist">Midnight Drive</p>
              <p className="text-[11px] text-mist-dim">Synthwave · Dreamy · 1:30</p>
            </div>
            <Badge tone="success">Ready</Badge>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Everything in one studio</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
            A complete music workflow, not a toy demo
          </h2>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel panel-hover p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-plum-300">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-mist">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mist-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-6xl px-5 py-16">
        <div className="panel overflow-hidden">
          <div className="grid gap-px bg-white/[0.06] md:grid-cols-3">
            {STEPS.map((item) => (
              <div key={item.step} className="bg-ink-900/80 p-6">
                <span className="text-xs font-bold tracking-[0.2em] text-ember-400">
                  {item.step}
                </span>
                <h3 className="mt-3 text-base font-semibold text-mist">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="controls" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Studio controls</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
              Direct the session like a producer
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-mist-muted">
              Genre, mood, tempo and length are all part of the brief. Switch between a full vocal
              performance and a clean instrumental, and let the lyrics writer draft the words when
              you want a starting point.
            </p>
            <Link href={user ? "/generate" : "/register"} className="btn-primary mt-6">
              Open the studio
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="panel space-y-5 p-6">
            <div>
              <p className="label">Genre</p>
              <div className="flex flex-wrap gap-2">
                {["Electronic", "Hip Hop", "Cinematic", "Lo-Fi", "R&B", "Rock", "Jazz"].map(
                  (genre, index) => (
                    <span
                      key={genre}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        index === 0
                          ? "border-ember-500/40 bg-ember-500/15 text-ember-400"
                          : "border-white/10 bg-white/[0.03] text-mist-muted"
                      }`}
                    >
                      {genre}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div>
              <p className="label">Mood</p>
              <div className="flex flex-wrap gap-2">
                {["Dreamy", "Uplifting", "Dark", "Epic", "Relaxed"].map((mood, index) => (
                  <span
                    key={mood}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      index === 1
                        ? "border-plum-500/40 bg-plum-500/15 text-plum-300"
                        : "border-white/10 bg-white/[0.03] text-mist-muted"
                    }`}
                  >
                    {mood}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="label">Tempo</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-mist">110</span>
                  <span className="text-xs text-mist-dim">BPM</span>
                </div>
              </div>
              <div>
                <p className="label">Length</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-mist">1:30</span>
                  <span className="text-xs text-mist-dim">sec</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ember-500/15 via-ink-900 to-plum-600/20 p-8 sm:p-12">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold-400/20 blur-3xl" />
          <h2 className="relative max-w-lg text-2xl font-bold tracking-tight text-mist sm:text-3xl">
            Your next track is one sentence away.
          </h2>
          <p className="relative mt-3 max-w-lg text-sm text-mist-muted">
            Create an account and start generating — unlimited generations, full downloads, your own
            private library.
          </p>
          <Link href={user ? "/dashboard" : "/register"} className="btn-primary relative mt-6">
            {user ? "Open dashboard" : "Create your account"}
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-xs text-mist-dim sm:flex-row">
          <span className="flex items-center gap-2">
            <IconWaveform className="h-4 w-4 text-mist-muted" /> Music AI
          </span>
          <span className="sm:ml-auto">AI music generation studio</span>
        </div>
      </footer>
    </div>
  );
}
