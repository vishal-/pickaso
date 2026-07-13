import { prisma } from "./prisma";

export type AppRecord = {
  id: string;
  name: string;
  owner: string;
  status: "Active" | "Review" | "Paused";
  description: string;
  updated: string;
  plan: string;
  region: string;
  lastDeploy: string;
  metrics: Array<{ label: string; value: string }>;
  highlights: string[];
};

function mapDbAppToRecord(app: { id: string; name: string; createdAt: Date }): AppRecord {
  const diffMs = Date.now() - app.createdAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  let updatedStr = "Just now";
  if (diffHours > 0) {
    updatedStr = diffHours === 1 ? "1h ago" : `${diffHours}h ago`;
    if (diffHours >= 24) {
      const diffDays = Math.floor(diffHours / 24);
      updatedStr = diffDays === 1 ? "Yesterday" : `${diffDays}d ago`;
    }
  }

  return {
    id: app.id,
    name: app.name,
    owner: "You",
    status: "Active",
    description: `Serves onboarding media for product pages, storefront feeds, and assets for ${app.name}.`,
    updated: updatedStr,
    plan: "Growth",
    region: "us-east-1",
    lastDeploy: updatedStr,
    metrics: [
      { label: "Uploads today", value: "0" },
      { label: "Storage used", value: "0 GB" },
      { label: "API calls", value: "0" },
    ],
    highlights: [
      "New app created and ready for configuration",
      "Upload and delivery settings can be tuned here",
      "Invite teammates to start using the workspace",
    ],
  };
}

export async function getApps(tenantId: string): Promise<AppRecord[]> {
  const dbApps = await prisma.app.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return dbApps.map(mapDbAppToRecord);
}

export async function getAppById(id: string, tenantId: string): Promise<AppRecord | null> {
  const dbApp = await prisma.app.findFirst({
    where: { id, tenantId },
  });
  return dbApp ? mapDbAppToRecord(dbApp) : null;
}

export async function createApp(name: string, tenantId: string): Promise<AppRecord> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("App name is required.");
  }

  const app = await prisma.app.create({
    data: {
      name: trimmedName,
      tenantId,
    },
  });

  return mapDbAppToRecord(app);
}
