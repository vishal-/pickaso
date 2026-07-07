import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAppById } from "@/lib/apps";
import { getSessionTenantId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ApiKeyManager } from "@/components/ApiKeyManager";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getSessionTenantId();
  if (!tenantId) {
    redirect("/login");
  }

  const { id } = await params;
  const app = await getAppById(id, tenantId);

  if (!app) {
    notFound();
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { appId: id },
    orderBy: { createdAt: "desc" },
  });

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

        <div className="space-y-6">
          <ApiKeyManager appId={id} initialKeys={apiKeys} />
        </div>
      </div>
    </div>
  );
}
