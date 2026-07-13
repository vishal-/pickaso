import crypto from "crypto";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getSessionTenantId } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  logger.info({ route: "/api/v1/collections", method: "GET" }, "Incoming collections list request");

  try {
    let appId: string;
    const authHeader = request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
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

      appId = apiKey.app.id;
    } else {
      // Fallback to session authentication
      const tenantId = await getSessionTenantId();
      if (!tenantId) {
        logger.warn({ route: "/api/v1/collections", method: "GET" }, "Unauthorized request: No session or auth header");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const reqAppId = searchParams.get("appId");
      if (!reqAppId) {
        return NextResponse.json({ error: "appId query parameter is required for session-based requests" }, { status: 400 });
      }

      // Verify app belongs to tenant
      const app = await prisma.app.findFirst({
        where: { id: reqAppId, tenantId },
      });
      if (!app) {
        return NextResponse.json({ error: "App not found or access denied" }, { status: 404 });
      }

      appId = reqAppId;
    }

    // Support pagination
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where: { appId },
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
        skip,
        take: limit,
      }),
      prisma.collection.count({
        where: { appId },
      }),
    ]);

    logger.info(
      { route: "/api/v1/collections", method: "GET", appId, count: collections.length, total },
      "Successfully listed collections"
    );

    return NextResponse.json(
      {
        collections: collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          imageCount: collection._count.images,
        })),
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ route: "/api/v1/collections", method: "GET", error }, "Failed to list collections");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}