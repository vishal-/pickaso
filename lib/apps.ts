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

const initialApps: AppRecord[] = [
  {
    id: "aurora",
    name: "Aurora Studio",
    owner: "Design Systems",
    status: "Active",
    description:
      "A collaborative media workspace for launching campaigns and product assets.",
    updated: "2h ago",
    plan: "Growth",
    region: "us-east-1",
    lastDeploy: "2 hours ago",
    metrics: [
      { label: "Uploads today", value: "184" },
      { label: "Storage used", value: "4.2 GB" },
      { label: "API calls", value: "12.8k" },
    ],
    highlights: [
      "CDN delivery enabled for all uploaded assets",
      "Signing policies configured for secure previews",
      "Multi-tenant configs are ready for new teams",
    ],
  },
  {
    id: "northwind",
    name: "Northwind Commerce",
    owner: "Commerce Platform",
    status: "Review",
    description:
      "Serves onboarding media for product pages, emails, and storefront feeds.",
    updated: "Yesterday",
    plan: "Scale",
    region: "eu-west-1",
    lastDeploy: "Yesterday",
    metrics: [
      { label: "Uploads today", value: "96" },
      { label: "Storage used", value: "2.6 GB" },
      { label: "API calls", value: "6.1k" },
    ],
    highlights: [
      "Image optimization is enabled on product imagery",
      "Review queue is waiting on final brand assets",
      "Webhook sync is active for order updates",
    ],
  },
  {
    id: "lumen",
    name: "Lumen Analytics",
    owner: "Data Experience",
    status: "Paused",
    description: "Manages reporting assets and audit-friendly image archives.",
    updated: "3d ago",
    plan: "Starter",
    region: "ap-southeast-2",
    lastDeploy: "3 days ago",
    metrics: [
      { label: "Uploads today", value: "24" },
      { label: "Storage used", value: "1.1 GB" },
      { label: "API calls", value: "1.9k" },
    ],
    highlights: [
      "Archive retention windows are configured",
      "Background processing is paused for maintenance",
      "Audit logs are being reviewed for compliance",
    ],
  },
];

let apps: AppRecord[] = initialApps.map((app) => ({ ...app }));

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getApps() {
  return apps;
}

export function getAppById(id: string) {
  return apps.find((app) => app.id === id);
}

export function createApp(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("App name is required.");
  }

  let id = toSlug(trimmedName);
  let suffix = 1;
  while (apps.some((app) => app.id === id)) {
    id = `${toSlug(trimmedName)}-${suffix}`;
    suffix += 1;
  }

  const app: AppRecord = {
    id,
    name: trimmedName,
    owner: "You",
    status: "Active",
    description: `A new app workspace for ${trimmedName}.`,
    updated: "Just now",
    plan: "Starter",
    region: "us-east-1",
    lastDeploy: "Just now",
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

  apps = [app, ...apps];
  return app;
}
