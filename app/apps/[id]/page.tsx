import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppById } from "@/lib/apps";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = getAppById(id);

  if (!app) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-400">
              App details
            </p>
            <h1
              className="mt-2 text-3xl font-semibold text-white"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {app.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {app.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              {app.status}
            </span>
            <Link
              href="/apps"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-500/30 hover:bg-indigo-500/10"
            >
              Back to apps
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
              <div className="grid gap-4 sm:grid-cols-3">
                {app.metrics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-lg font-semibold text-white">Highlights</h2>
              <ul className="mt-4 space-y-3">
                {app.highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-300">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
              Workspace info
            </p>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-slate-400">Owner</span>
                <span className="font-medium text-white">{app.owner}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-slate-400">Plan</span>
                <span className="font-medium text-white">{app.plan}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-slate-400">Region</span>
                <span className="font-medium text-white">{app.region}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last deploy</span>
                <span className="font-medium text-white">{app.lastDeploy}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
