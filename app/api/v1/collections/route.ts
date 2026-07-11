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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawApiKey = authHeader.slice("Bearer ".length).trim();
    if (!rawApiKey || !rawApiKey.startsWith("pk_")) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("READ");
    if (!canRead) {
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