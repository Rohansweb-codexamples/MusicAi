"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/client";
import type { UserDTO } from "@/lib/types";
import {
  IconClock,
  IconClose,
  IconHome,
  IconLibrary,
  IconLogOut,
  IconMenu,
  IconShield,
  IconSparkles,
  IconWaveform,
} from "./icons";
import { PlayerProvider } from "./player";
import { Badge } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: IconHome },
  { href: "/generate", label: "Create", icon: IconSparkles },
  { href: "/library", label: "Library", icon: IconLibrary },
  { href: "/history", label: "History", icon: IconClock },
];

export function AppShell({ user, children }: { user: UserDTO; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const links = user.role === "ADMIN" ? [...NAV, { href: "/admin", label: "Admin", icon: IconShield }] : NAV;

  async function signOut() {
    setSigningOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-gradient-to-r from-ember-500/15 to-plum-500/10 text-mist"
                : "text-mist-muted hover:bg-white/[0.04] hover:text-mist"
            }`}
          >
            {active ? (
              <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-ember-500 to-gold-400" />
            ) : null}
            <Icon className={`h-[18px] w-[18px] ${active ? "text-ember-400" : ""}`} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarBody = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ember-500 via-ember-500 to-plum-500 text-ink-950">
          <IconWaveform className="h-5 w-5" />
        </span>
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-mist">Music AI</span>
      </Link>

      {nav}

      <div className="space-y-3">
        <Link
          href="/generate"
          onClick={() => setOpen(false)}
          className="btn-primary w-full justify-center"
        >
          <IconSparkles className="h-4 w-4" />
          New track
        </Link>

        <div className="rounded-xl border border-gold-400/25 bg-gold-400/[0.07] px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">
            Studio plan
          </p>
          <p className="mt-0.5 text-xs text-mist-muted">Unlimited generations</p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-plum-600 to-ember-500 text-xs font-bold text-white">
            {initials || "M"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-mist">{user.name}</p>
            <p className="truncate text-[11px] text-mist-dim">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-mist-dim transition hover:bg-white/[0.06] hover:text-mist"
          >
            <IconLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PlayerProvider>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-white/[0.06] bg-ink-900/60 backdrop-blur-xl lg:block">
          {sidebarBody}
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-white/10 bg-ink-900">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-mist-dim"
              >
                <IconClose className="h-4 w-4" />
              </button>
              {sidebarBody}
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.06] bg-ink-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-mist"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-mist">Music AI</span>
            <Badge tone="gold" className="ml-auto">
              Unlimited
            </Badge>
          </header>

          <main className="flex-1 px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pt-8">{children}</main>
        </div>
      </div>
    </PlayerProvider>
  );
}
