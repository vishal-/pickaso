import { NextResponse } from "next/server";
import { getApps, createApp } from "@/lib/apps";
import { getSessionTenantId } from "@/lib/session";

export async function GET() {
  try {
    const tenantId = await getSessionTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apps = await getApps(tenantId);
    return NextResponse.json({ apps }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch apps.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = await getSessionTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name : "";
    const app = await createApp(name, tenantId);

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create app.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
