import crypto from "crypto";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  logger.info({ route: "/api/v1/collections", method: "GET" }, "Incoming collections list request");

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logger.warn({ route: "/api/v1/collections", method: "GET" }, "Unauthorized request: Invalid or missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawApiKey = authHeader.slice("Bearer ".length).trim();
    if (!rawApiKey || !rawApiKey.startsWith("pk_")) {
      logger.warn({ route: "/api/v1/collections", method: "GET" }, "Unauthorized request: Invalid API key format");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hashedKey = crypto.createHash("sha256").update(rawApiKey).digest("hex");

    const apiKey = await prisma.apiKey.findFirst({
      where: { key: hashedKey },
      include: {
        app: {
          select: {
            id: true,
            tenantId: true,
          },
        },
      },
    });

    if (!apiKey) {
      logger.warn({ route: "/api/v1/collections", method: "GET" }, "Unauthorized request: API key not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("READ");
    if (!canRead) {
      logger.warn(
        { route: "/api/v1/collections", method: "GET", appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Forbidden request: API key lacks required scope"
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const collections = await prisma.collection.findMany({
      where: {
        appId: apiKey.app.id,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    logger.info(
      { route: "/api/v1/collections", method: "GET", appId: apiKey.app.id, tenantId: apiKey.app.tenantId, count: collections.length },
      "Successfully listed collections"
    );

    return NextResponse.json(
      {
        collections: collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          imageCount: collection._count.images,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ route: "/api/v1/collections", method: "GET", error }, "Failed to list collections");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}