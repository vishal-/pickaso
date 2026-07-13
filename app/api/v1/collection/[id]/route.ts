import crypto from "crypto";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getSessionTenantId } from "@/lib/session";

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

  const key = (options as { key?: unknown }).key;
  if (typeof key !== "string" || key.length === 0) {
    return null;
  }

  const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!r2PublicBaseUrl) {
    return null;
  }

  const trimmedBase = r2PublicBaseUrl.replace(/\/+$/, "");
  const trimmedPath = key.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedPath}`;
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
  let id: string | undefined;
  try {
    ({ id } = await params);
    logger.info({ route: "/api/v1/collection/[id]", method: "GET", collectionId: id }, "Incoming collection images request");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logger.warn({ route: "/api/v1/collection/[id]", method: "GET", collectionId: id }, "Unauthorized request: Invalid or missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawApiKey = authHeader.slice("Bearer ".length).trim();
    if (!rawApiKey || !rawApiKey.startsWith("pk_")) {
      logger.warn({ route: "/api/v1/collection/[id]", method: "GET", collectionId: id }, "Unauthorized request: Invalid API key format");
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
      logger.warn({ route: "/api/v1/collection/[id]", method: "GET", collectionId: id }, "Unauthorized request: API key not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("READ");
    if (!canRead) {
      logger.warn(
        { route: "/api/v1/collection/[id]", method: "GET", collectionId: id, appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Forbidden request: API key lacks required scope"
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      logger.warn(
        { route: "/api/v1/collection/[id]", method: "GET", collectionId: id, appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Collection not found"
      );
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

    logger.info(
      { route: "/api/v1/collection/[id]", method: "GET", collectionId: id, appId: apiKey.app.id, tenantId: apiKey.app.tenantId, imageCount: images.length },
      "Successfully fetched collection images"
    );

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
      { route: "/api/v1/collection/[id]", method: "GET", collectionId: id, error },
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
  let id: string | undefined;
  try {
    ({ id } = await params);
    logger.info({ route: "/api/v1/collection/[id]", method: "DELETE", collectionId: id }, "Incoming collection delete request");

    const authHeader = request.headers.get("authorization");
    let collection: { id: string; name: string } | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const rawApiKey = authHeader.slice("Bearer ".length).trim();
      if (!rawApiKey || !rawApiKey.startsWith("pk_")) {
        logger.warn({ route: "/api/v1/collection/[id]", method: "DELETE", collectionId: id }, "Unauthorized request: Invalid API key format");
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
        logger.warn({ route: "/api/v1/collection/[id]", method: "DELETE", collectionId: id }, "Unauthorized request: API key not found");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const canDelete = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("DELETE");
      if (!canDelete) {
        logger.warn(
          { route: "/api/v1/collection/[id]", method: "DELETE", collectionId: id, appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
          "Forbidden request: API key lacks required scope"
        );
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      collection = await prisma.collection.findFirst({
        where: {
          id,
          appId: apiKey.app.id,
        },
        select: {
          id: true,
          name: true,
        },
      });
    } else {
      // Fallback to session authentication
      const tenantId = await getSessionTenantId();
      if (!tenantId) {
        logger.warn({ route: "/api/v1/collection/[id]", method: "DELETE", collectionId: id }, "Unauthorized request: No session or auth header");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify collection belongs to app owned by tenant
      collection = await prisma.collection.findFirst({
        where: {
          id,
          app: { tenantId },
        },
        select: {
          id: true,
          name: true,
        },
      });
    }

    if (!collection) {
      logger.warn(
        { route: "/api/v1/collection/[id]", method: "DELETE", collectionId: id },
        "Collection not found for deletion"
      );
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const images = await prisma.image.findMany({
      where: {
        collectionId: collection.id,
      },
      select: {
        id: true,
        options: true,
        variants: {
          select: {
            options: true,
          },
        },
      },
    });

    for (const image of images) {
      const objectKey = getImageObjectKey(image.options);
      if (objectKey) {
        try {
          await deleteR2ObjectIfPossible(objectKey);
        } catch (error) {
          logger.warn(
            {
              route: "/api/v1/collection/[id]",
              method: "DELETE",
              collectionId: collection.id,
              imageId: image.id,
              objectKey,
              error,
            },
            "Failed to delete image object from R2 during collection delete"
          );
        }
      }

      for (const variant of image.variants) {
        const variantKey = getImageObjectKey(variant.options);
        if (variantKey) {
          try {
            await deleteR2ObjectIfPossible(variantKey);
          } catch (error) {
            logger.warn(
              {
                route: "/api/v1/collection/[id]",
                method: "DELETE",
                collectionId: collection.id,
                imageId: image.id,
                variantKey,
                error,
              },
              "Failed to delete variant image object from R2 during collection delete"
            );
          }
        }
      }
    }

    await prisma.collection.delete({
      where: {
        id: collection.id,
      },
    });

    logger.info(
      {
        route: "/api/v1/collection/[id]",
        method: "DELETE",
        collectionId: collection.id,
        collectionName: collection.name,
        deletedImagesCount: images.length,
      },
      "Successfully deleted collection and its images"
    );

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
      { route: "/api/v1/collection/[id]", method: "DELETE", collectionId: id, error },
      "Failed to delete collection"
    );
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}