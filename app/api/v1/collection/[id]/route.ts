import crypto from "crypto";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getOptionalEnv(name: string): string | null {
  return process.env[name] ?? null;
}

function getImageObjectKey(options: unknown): string | null {
  if (!options || typeof options !== "object") {
    return null;
  }

  const key = (options as { key?: unknown }).key;
  return typeof key === "string" && key.length > 0 ? key : null;
}

function getImagePublicUrl(options: unknown): string | null {
  if (!options || typeof options !== "object") {
    return null;
  }

  const url = (options as { url?: unknown }).url;
  return typeof url === "string" && url.length > 0 ? url : null;
}

async function deleteR2ObjectIfPossible(objectKey: string): Promise<void> {
  const r2AccountId = getOptionalEnv("R2_ACCOUNT_ID");
  const r2AccessKeyId = getOptionalEnv("R2_ACCESS_KEY_ID");
  const r2SecretAccessKey = getOptionalEnv("R2_SECRET_ACCESS_KEY");
  const r2Bucket = getOptionalEnv("R2_BUCKET");

  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket) {
    return;
  }

  const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: r2Bucket,
      Key: objectKey,
    })
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  logger.info({ route: "/api/v1/collection/[id]", method: "GET" }, "Incoming collection images request");

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

    const { id } = await params;

    const collection = await prisma.collection.findFirst({
      where: {
        id,
        appId: apiKey.app.id,
      },
      select: {
        id: true,
      },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const images = await prisma.image.findMany({
      where: {
        collectionId: collection.id,
        appId: apiKey.app.id,
      },
      select: {
        id: true,
        size: true,
        options: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        images: images.map((image) => ({
          id: image.id,
          url: getImagePublicUrl(image.options),
          size: image.size,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      { route: "/api/v1/collection/[id]", method: "GET", error },
      "Failed to fetch collection images"
    );
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  logger.info({ route: "/api/v1/collection/[id]", method: "DELETE" }, "Incoming collection delete request");

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

    const canDelete = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("DELETE");
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const collection = await prisma.collection.findFirst({
      where: {
        id,
        appId: apiKey.app.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const images = await prisma.image.findMany({
      where: {
        collectionId: collection.id,
        appId: apiKey.app.id,
      },
      select: {
        id: true,
        options: true,
      },
    });

    for (const image of images) {
      const objectKey = getImageObjectKey(image.options);
      if (!objectKey) {
        continue;
      }

      try {
        await deleteR2ObjectIfPossible(objectKey);
      } catch (error) {
        logger.warn(
          {
            route: "/api/v1/collection/[id]",
            method: "DELETE",
            imageId: image.id,
            objectKey,
            error,
          },
          "Failed to delete image object from R2 during collection delete"
        );
      }
    }

    await prisma.collection.delete({
      where: {
        id: collection.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: collection.id,
        name: collection.name,
        deletedImages: images.length,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      { route: "/api/v1/collection/[id]", method: "DELETE", error },
      "Failed to delete collection"
    );
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}