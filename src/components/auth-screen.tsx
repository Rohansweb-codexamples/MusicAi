import Link from "next/link";
import { AuthForm } from "./auth-form";
import { CoverArt } from "./cover-art";
import { IconCheck, IconWaveform } from "./icons";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ember-500 to-plum-500 text-ink-950">
              <IconWaveform className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.22em] text-mist">Music AI</span>
          </Link>

          <h1 className="mt-10 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
            {mode === "login" ? "Welcome back to the studio" : "Create your studio account"}
          </h1>
          <p className="mt-2 text-sm text-mist-muted">
            {mode === "login"
              ? "Sign in to pick up where your last session left off."
              : "Unlimited generations, a private library and full downloads."}
          </p>

          <div className="mt-8">
            <AuthForm mode={mode} />
          </div>

          <ul className="mt-10 space-y-2.5 text-xs text-mist-dim">
            {["Full songs with vocals or clean instrumentals", "Every generation saved with its settings", "Your provider keys never leave the server"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-gold-400" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-white/[0.06] lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-plum-600/25 via-ink-950 to-ember-500/15" />
        <div className="relative flex h-full flex-col justify-center gap-6 p-14">
          <div className="grid grid-cols-2 gap-5">
            <CoverArt seed="night-drive" genre="Electronic" className="aspect-square rounded-2xl shadow-glow" />
            <CoverArt seed="velvet-choir" genre="R&B" className="mt-8 aspect-square rounded-2xl" />
            <CoverArt seed="open-roads" genre="Afrobeats" className="-mt-2 aspect-square rounded-2xl" />
            <CoverArt seed="blue-hour" genre="Ambient" className="mt-4 aspect-square rounded-2xl" />
          </div>

          <blockquote className="panel max-w-md p-5">
            <p className="text-sm leading-relaxed text-mist">
              “Brief a track, hear it in your browser, keep the take. That loop is the whole studio.”
            </p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-mist-dim">
              Music AI · studio workflow
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
