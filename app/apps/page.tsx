"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getApps } from "@/lib/apps";
import { useAuth } from "@/components/AuthProvider";

const initialApps = getApps();

export default function AppsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState(initialApps);

  async function handleCreateApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter an app name.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create app.");
      }

      setApps((current) => [data.app, ...current]);
      router.push(`/apps/${data.app.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create app.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-400">
              App management
            </p>
            <h1
              className="mt-2 text-3xl font-semibold text-white"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Applications
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Review active apps, inspect usage, and jump into the details of
              any workspace you manage.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-500/30 hover:bg-indigo-500/10"
          >
            Back to dashboard
          </Link>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Your apps</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Managed workspaces and their latest updates.
                </p>
              </div>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                {apps.length} active
              </span>
            </div>

            <div className="space-y-3">
              {apps.map((app) => (
                <Link
                  key={app.id}
                  href={`/apps/${app.id}`}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-indigo-500/30 hover:bg-indigo-500/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {app.name}
                      </h3>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        {app.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {app.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400 sm:flex-col sm:items-end">
                    <span>{app.owner}</span>
                    <span>Updated {app.updated}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-lg font-semibold text-white">
                Create a new app
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Start a fresh workspace and jump straight into app-specific
                details.
              </p>
              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={handleCreateApp}
              >
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="App name"
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-500/40"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating..." : "Create app"}
                </button>
              </form>
              {error ? (
                <p className="mt-3 text-sm text-rose-400">{error}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
                Quick insights
              </p>
              <h2 className="mt-3 text-xl font-semibold text-white">
                Stay on top of every app
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Use this view to spot deployment health, review last changes,
                and drill into each workspace for deeper context.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Uploads this week", value: "1.2k" },
                  { label: "Pending review", value: "3" },
                  { label: "Average latency", value: "320ms" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-slate-950/40 p-3"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
