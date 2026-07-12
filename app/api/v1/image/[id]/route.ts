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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    ({ id } = await params);
    logger.info({ route: "/api/v1/image/[id]", method: "DELETE", imageId: id }, "Incoming image delete request");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logger.warn({ route: "/api/v1/image/[id]", method: "DELETE", imageId: id }, "Unauthorized request: Invalid or missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawApiKey = authHeader.slice("Bearer ".length).trim();
    if (!rawApiKey || !rawApiKey.startsWith("pk_")) {
      logger.warn({ route: "/api/v1/image/[id]", method: "DELETE", imageId: id }, "Unauthorized request: Invalid API key format");
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
      logger.warn({ route: "/api/v1/image/[id]", method: "DELETE", imageId: id }, "Unauthorized request: API key not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canDelete = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("DELETE");
    if (!canDelete) {
      logger.warn(
        { route: "/api/v1/image/[id]", method: "DELETE", imageId: id, appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Forbidden request: API key lacks required scope"
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const image = await prisma.image.findFirst({
      where: {
        id,
        appId: apiKey.app.id,
      },
      select: {
        id: true,
        slug: true,
        options: true,
      },
    });

    if (!image) {
      logger.warn(
        { route: "/api/v1/image/[id]", method: "DELETE", imageId: id, appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Image not found for deletion"
      );
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const objectKey = getImageObjectKey(image.options);
    if (objectKey) {
      try {
        await deleteR2ObjectIfPossible(objectKey);
      } catch (error) {
        logger.warn(
          {
            route: "/api/v1/image/[id]",
            method: "DELETE",
            imageId: image.id,
            objectKey,
            error,
          },
          "Failed to delete image object from R2"
        );
      }
    }

    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    logger.info(
      {
        route: "/api/v1/image/[id]",
        method: "DELETE",
        imageId: image.id,
        slug: image.slug,
        appId: apiKey.app.id,
        tenantId: apiKey.app.tenantId,
      },
      "Successfully deleted image"
    );

    return NextResponse.json(
      {
        success: true,
        id: image.id,
        name: image.slug,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ route: "/api/v1/image/[id]", method: "DELETE", imageId: id, error }, "Failed to delete image");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}