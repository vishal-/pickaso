import { NextResponse } from "next/server";
import { getApps, createApp } from "@/lib/apps";
import { getSessionTenantId } from "@/lib/session";
import logger from "@/lib/logger";

export async function GET() {
  logger.info({ route: "/api/apps", method: "GET" }, "Incoming apps list request");
  try {
    const tenantId = await getSessionTenantId();
    if (!tenantId) {
      logger.warn({ route: "/api/apps", method: "GET" }, "Unauthorized apps list request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apps = await getApps(tenantId);
    logger.info(
      { route: "/api/apps", method: "GET", tenantId, appCount: apps.length },
      "Apps list fetched"
    );
    return NextResponse.json({ apps }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch apps.";
    logger.error(
      { route: "/api/apps", method: "GET", error },
      "Failed to fetch apps list"
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  logger.info({ route: "/api/apps", method: "POST" }, "Incoming app creation request");
  try {
    const tenantId = await getSessionTenantId();
    if (!tenantId) {
      logger.warn({ route: "/api/apps", method: "POST" }, "Unauthorized app creation request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name : "";
    const app = await createApp(name, tenantId);

    logger.info(
      { route: "/api/apps", method: "POST", tenantId, appId: app.id },
      "App created"
    );

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create app.";
    logger.error(
      { route: "/api/apps", method: "POST", error },
      "Failed to create app"
    );
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
