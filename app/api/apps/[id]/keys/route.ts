import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionTenantId } from "@/lib/session";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getSessionTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: appId } = await params;

    // Verify app exists and belongs to the tenant
    const app = await prisma.app.findFirst({
      where: { id: appId, tenantId },
    });
    if (!app) {
      return NextResponse.json({ error: "App not found or access denied" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const requestedScopes = Array.isArray(body?.scopes) ? body.scopes : [];

    if (!name) {
      return NextResponse.json({ error: "Key name is required." }, { status: 400 });
    }

    if (requestedScopes.length === 0) {
      return NextResponse.json({ error: "At least one scope must be selected." }, { status: 400 });
    }

    // Map strings to ApiKeyScope enum string literals
    const scopes: ("ALL" | "READ" | "WRITE" | "DELETE")[] = [];
    if (requestedScopes.includes("ALL")) {
      scopes.push("ALL");
    } else {
      if (requestedScopes.includes("READ")) scopes.push("READ");
      if (requestedScopes.includes("WRITE")) scopes.push("WRITE");
      if (requestedScopes.includes("DELETE")) scopes.push("DELETE");
    }

    if (scopes.length === 0) {
      return NextResponse.json({ error: "Invalid scopes selected." }, { status: 400 });
    }

    // Generate secure random key
    const rawKey = `pk_${crypto.randomBytes(24).toString("hex")}`;
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    // Persist key to database
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        scopes,
        appId,
      },
    });

    return NextResponse.json({
      apiKey: {
        ...apiKey,
        key: rawKey // Return the raw unhashed key once so the user can copy it
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to generate API key:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
