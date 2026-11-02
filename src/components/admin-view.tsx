"use client";

import Link from "next/link";
import { useState } from "react";
import {
  IconClock,
  IconRefresh,
  IconShield,
  IconSparkles,
  IconWaveform,
} from "@/components/icons";
import { Badge, Spinner } from "@/components/ui";
import { apiFetch } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";

type AdminOverview = {
  provider: {
    name: string;
    configured: boolean;
    vocalsModel: string;
    instrumentalModel: string;
    lyricsWriterConfigured: boolean;
  };
  limits: {
    maxActive: number;
    perHour: number;
    dailyProviderSeconds: number;
    maxDurationSeconds: number;
  };
  totals: {
    users: number;
    tracks: number;
    activeJobs: number;
    tracks24h: number;
    succeeded24h: number;
    failed24h: number;
    minutes24h: number;
    calls24h: number;
    errorRate: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    tracks: number;
    createdAt: string;
  }>;
  recentFailures: Array<{
    id: string;
    title: string;
    error: string | null;
    createdAt: string;
    providerModel: string | null;
    user: { email: string };
  }>;
  recentTracks: Array<{
    id: string;
    title: string;
    status: string;
    genre: string;
    duration: number;
    createdAt: string;
    user: { email: string };
  }>;
};

export function AdminView({ currentUserId }: { currentUserId: string }) {
  const { data, loading, error, refresh } = useApi<AdminOverview>("/api/admin/overview", {
    pollMs: 8000,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function changeRole(id: string, role: "USER" | "ADMIN") {
    setBusyId(id);
    setActionError(null);
    try {
      await apiFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not update that account.");
    } finally {
      setBusyId(null);
    }
  }

  const usedPercent = data
    ? Math.min(
        100,
        Math.round(
          ((data.totals.minutes24h * 60 + data.totals.activeJobs * 0) /
            Math.max(1, data.limits.dailyProviderSeconds)) *
            100,
        ),
      )
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-mist sm:text-3xl">
            Control room
          </h1>
          <p className="mt-1.5 text-sm text-mist-muted">
            Accounts, generation volume and live provider usage for this installation.
          </p>
        </div>
        <button type="button" onClick={() => refresh()} className="btn-ghost w-fit">
          <IconRefresh className="h-4 w-4" />
          Refresh
        </button>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Accounts"
          value={loading ? "—" : String(data?.totals.users ?? 0)}
          hint="registered users"
        />
        <Tile
          label="Generations 24h"
          value={loading ? "—" : String(data?.totals.tracks24h ?? 0)}
          hint={`${data?.totals.succeeded24h ?? 0} succeeded · ${data?.totals.failed24h ?? 0} failed`}
        />
        <Tile
          label="Audio 24h"
          value={loading ? "—" : `${data?.totals.minutes24h ?? 0}m`}
          hint={`${data?.totals.calls24h ?? 0} provider calls`}
        />
        <Tile
          label="Provider errors"
          value={loading ? "—" : `${data?.totals.errorRate ?? 0}%`}
          hint="last 24 hours"
          tone={(data?.totals.errorRate ?? 0) > 10 ? "danger" : "success"}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-mist">Music provider</p>
            <Badge tone={data?.provider.configured ? "success" : "danger"}>
              {data?.provider.configured ? "Configured" : "Key missing"}
            </Badge>
          </div>

          <dl className="mt-4 space-y-2.5 text-sm">
            <Row label="Driver" value={data?.provider.name ?? "—"} />
            <Row label="Vocals model" value={data?.provider.vocalsModel ?? "—"} />
            <Row label="Instrumental model" value={data?.provider.instrumentalModel ?? "—"} />
            <Row
              label="Lyrics writer"
              value={data?.provider.lyricsWriterConfigured ? "Configured" : "Not configured"}
            />
          </dl>

          {data && !data.provider.configured ? (
            <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-200">
              Add the provider API key in the server environment to enable real generation. Keys are
              read server-side only and never sent to the browser.
            </p>
          ) : null}
        </section>

        <section className="panel p-5">
          <p className="text-sm font-semibold text-mist">Provider capacity (24h)</p>
          <p className="mt-2 text-xs text-mist-muted">
            {data?.totals.minutes24h ?? 0} of{" "}
            {Math.round((data?.limits.dailyProviderSeconds ?? 0) / 60)} minutes used
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ember-500 via-gold-400 to-plum-400 transition-all"
              style={{ width: `${usedPercent}%` }}
            />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <MiniStat label="Active renders" value={String(data?.totals.activeJobs ?? 0)} />
            <MiniStat label="Concurrent limit" value={String(data?.limits.maxActive ?? 0)} />
            <MiniStat label="Per hour / user" value={String(data?.limits.perHour ?? 0)} />
            <MiniStat label="Max length" value={`${data?.limits.maxDurationSeconds ?? 0}s`} />
          </dl>

          <p className="mt-4 text-[11px] leading-relaxed text-mist-dim">
            Users get unlimited app credits — these are fair-use guard rails that protect the
            provider account, not a credit system.
          </p>
        </section>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <p className="text-sm font-semibold text-mist">Accounts</p>
          <span className="text-[11px] text-mist-dim">{data?.users.length ?? 0} shown</span>
        </div>

        {actionError ? (
          <p className="border-b border-amber-400/20 bg-amber-400/10 px-5 py-2.5 text-xs text-amber-200">
            {actionError}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.14em] text-mist-dim">
                <th className="px-5 py-3 font-semibold">Account</th>
                <th className="px-5 py-3 font-semibold">Tracks</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users ?? []).map((user) => (
                <tr key={user.id} className="border-t border-white/[0.05]">
                  <td className="px-5 py-3">
                    <p className="font-medium text-mist">{user.name}</p>
                    <p className="text-[11px] text-mist-dim">{user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-mist-muted">{user.tracks}</td>
                  <td className="px-5 py-3 text-[11px] text-mist-dim">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        disabled={user.id === currentUserId || busyId === user.id}
                        onChange={(event) =>
                          changeRole(user.id, event.target.value as "USER" | "ADMIN")
                        }
                        className="field w-32 py-1.5 text-xs"
                        aria-label={`Role for ${user.email}`}
                      >
                        <option value="USER" className="bg-ink-900">
                          User
                        </option>
                        <option value="ADMIN" className="bg-ink-900">
                          Admin
                        </option>
                      </select>
                      {busyId === user.id ? <Spinner className="h-3.5 w-3.5" /> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-mist">
            <IconShield className="h-4 w-4 text-red-300" /> Recent failures
          </p>
          <div className="mt-3 space-y-3">
            {(data?.recentFailures ?? []).length === 0 ? (
              <p className="text-xs text-mist-dim">No failed generations.</p>
            ) : (
              data?.recentFailures.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-mist">{item.title}</p>
                    <span className="shrink-0 text-[10px] text-mist-dim">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-red-200/80">
                    {item.error}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-mist-dim">
                    {item.user.email} · {item.providerModel ?? "unknown model"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-mist">
            <IconClock className="h-4 w-4 text-plum-300" /> Latest activity
          </p>
          <div className="mt-3 space-y-2">
            {(data?.recentTracks ?? []).length === 0 ? (
              <p className="text-xs text-mist-dim">No generations yet.</p>
            ) : (
              data?.recentTracks.map((item) => (
                <Link
                  key={item.id}
                  href="/admin"
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-white/[0.04]"
                >
                  <span className="min-w-0 flex-1 truncate text-mist">{item.title}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-mist-dim">
                    {item.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="panel flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-plum-300">
          <IconSparkles className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-mist">Provider keys stay server-side</p>
          <p className="mt-1 text-xs text-mist-muted">
            Generation runs in a background worker. Browser sessions never touch provider
            credentials, and audio is served only through an ownership-checked endpoint.
          </p>
        </div>
        <Badge tone="plum">
          <IconWaveform className="h-3 w-3" /> Worker active
        </Badge>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const valueTone =
    tone === "danger" ? "text-red-300" : tone === "success" ? "text-emerald-300" : "text-mist";
  return (
    <div className="panel panel-hover p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-mist-dim">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueTone}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-mist-muted">{hint}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-mist-dim">{label}</dt>
      <dd className="truncate text-xs font-medium text-mist">{value}</dd>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-mist-dim">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-mist">{value}</p>
    </div>
  );
}
