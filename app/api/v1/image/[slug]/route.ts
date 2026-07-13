import crypto from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SUPPORTED_FORMATS = ["webp", "png", "jpg", "jpeg", "avif", "tiff"];
const SUPPORTED_SIZES = ["sm", "md", "lg"];
const SIZE_MAP: Record<string, number> = {
  sm: 320,
  md: 640,
  lg: 1280
};

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

function getMimeType(format: string): string {
  switch (format) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "tiff":
      return "image/tiff";
    default:
      return "application/octet-stream";
  }
}

function getNormalizedFormat(format: string): string {
  return format === "jpeg" ? "jpg" : format;
}

function encodeImage(image: ReturnType<typeof sharp>, format: string): ReturnType<typeof sharp> {
  const normFormat = getNormalizedFormat(format);
  switch (normFormat) {
    case "jpg":
      return image.jpeg({ quality: 90 });
    case "png":
      return image.png({ compressionLevel: 9 });
    case "webp":
      return image.webp({ quality: 90 });
    case "avif":
      return image.avif({ quality: 70 });
    case "tiff":
      return image.tiff({ quality: 90 });
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function toPublicUrl(baseUrl: string, objectPath: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = objectPath.replace(/^\/+/, "");
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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: slugParam } = await params;
    const { searchParams } = new URL(request.url);

    const rawFmt = searchParams.get("fmt");
    const rawSize = searchParams.get("size");

    logger.info(
      { route: "/api/v1/image/[slug]", method: "GET", slugParam, fmt: rawFmt, size: rawSize },
      "Incoming image request"
    );

    // 1. Parse slug and extension
    const lastDotIndex = slugParam.lastIndexOf(".");
    if (lastDotIndex === -1) {
      logger.warn({ route: "/api/v1/image/[slug]", method: "GET", slugParam }, "Missing file extension");
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const slug = slugParam.substring(0, lastDotIndex);
    const ext = slugParam.substring(lastDotIndex + 1).toLowerCase();

    // 2. Determine target options
    const targetFormat = rawFmt ? rawFmt.toLowerCase() : ext;
    const targetSize = rawSize ? rawSize.toLowerCase() : "original";

    // Validate parameters
    if (rawFmt && !SUPPORTED_FORMATS.includes(targetFormat)) {
      return NextResponse.json({ error: "Unsupported image format requested" }, { status: 400 });
    }
    if (rawSize && !SUPPORTED_SIZES.includes(targetSize)) {
      return NextResponse.json({ error: "Unsupported size requested" }, { status: 400 });
    }

    const variantFormat = getNormalizedFormat(targetFormat);
    const isOriginalFormat = variantFormat === getNormalizedFormat(ext);
    const isOriginalSize = targetSize === "original";

    // 3. Single-query original image + target variant
    const image = await prisma.image.findFirst({
      where: {
        slug,
        format: ext,
      },
      include: {
        variants: {
          where: {
            size: targetSize,
            format: variantFormat,
          },
        },
      },
    });

    if (!image) {
      logger.warn({ route: "/api/v1/image/[slug]", method: "GET", slug, ext }, "Original image not found");
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // 4. Redirect if original is requested or variant matches original spec
    if (isOriginalFormat && isOriginalSize) {
      const originalUrl = getImagePublicUrl(image.options);
      if (!originalUrl) {
        return NextResponse.json({ error: "Original image URL missing" }, { status: 404 });
      }
      logger.info({ route: "/api/v1/image/[slug]", method: "GET", slug }, "Serving original image");
      return NextResponse.redirect(originalUrl, { status: 302 });
    }

    // 5. Redirect if cached variant already exists
    if (image.variants.length > 0) {
      const variantUrl = getImagePublicUrl(image.variants[0].options);
      if (variantUrl) {
        logger.info({ route: "/api/v1/image/[slug]", method: "GET", slug, targetSize, variantFormat }, "Serving existing variant");
        return NextResponse.redirect(variantUrl, { status: 302 });
      }
    }

    // 6. Generate variant (Cache miss)
    const r2AccountId = getOptionalEnv("R2_ACCOUNT_ID");
    const r2AccessKeyId = getOptionalEnv("R2_ACCESS_KEY_ID");
    const r2SecretAccessKey = getOptionalEnv("R2_SECRET_ACCESS_KEY");
    const r2Bucket = getOptionalEnv("R2_BUCKET");
    const r2PublicBaseUrl = getOptionalEnv("R2_PUBLIC_BASE_URL");

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket || !r2PublicBaseUrl) {
      logger.error("R2 configuration is incomplete");
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    const r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });

    const originalKey = (image.options as any).key;
    if (!originalKey) {
      logger.error("Original object key missing in options");
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    logger.info({ key: originalKey }, "Downloading original image from R2");
    const s3Response = await r2Client.send(
      new GetObjectCommand({
        Bucket: r2Bucket,
        Key: originalKey,
      })
    );

    if (!s3Response.Body) {
      throw new Error("Empty body from R2 response");
    }

    const originalBuffer = Buffer.from(await s3Response.Body.transformToByteArray());

    // Process image using sharp
    let sharpImg = sharp(originalBuffer);
    
    if (targetSize !== "original") {
      const targetWidth = SIZE_MAP[targetSize];
      sharpImg = sharpImg.resize({ width: targetWidth, withoutEnlargement: true });
    }

    const processedImg = encodeImage(sharpImg, variantFormat);
    const variantBuffer = await processedImg.toBuffer();
    const variantMetadata = await sharp(variantBuffer).metadata();

    const width = variantMetadata.width || 0;
    const height = variantMetadata.height || 0;

    // Upload variant back to R2
    const variantSlug = targetSize !== "original" ? `${image.slug}_${targetSize}` : image.slug;
    const variantObjectName = `${variantSlug}.${variantFormat}`;
    const variantObjectKey = variantObjectName;

    logger.info({ key: variantObjectKey }, "Uploading variant back to R2");
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: variantObjectKey,
        Body: variantBuffer,
        ContentType: getMimeType(variantFormat),
      })
    );

    const variantPublicUrl = toPublicUrl(r2PublicBaseUrl, variantObjectKey);

    // Save variant to Database (without storing url)
    try {
      await prisma.imageVariant.create({
        data: {
          imageId: image.id,
          slug: variantSlug,
          format: variantFormat,
          size: targetSize,
          width,
          height,
          fileSize: variantBuffer.byteLength,
          options: {
            bucket: r2Bucket,
            key: variantObjectKey,
          },
        },
      });
      logger.info({ variantSlug, format: variantFormat, size: targetSize }, "Successfully created image variant in DB");
    } catch (dbError: any) {
      if (dbError.code === "P2002") {
        const concurrentVariant = await prisma.imageVariant.findUnique({
          where: {
            imageId_size_format: {
              imageId: image.id,
              size: targetSize,
              format: variantFormat,
            },
          },
        });
        if (concurrentVariant) {
          const concurrentUrl = getImagePublicUrl(concurrentVariant.options);
          if (concurrentUrl) {
            logger.info("Serving concurrently created image variant");
            return NextResponse.redirect(concurrentUrl, { status: 302 });
          }
        }
      }
      throw dbError;
    }

    return NextResponse.redirect(variantPublicUrl, { status: 302 });
  } catch (error) {
    logger.error({ route: "/api/v1/image/[slug]", method: "GET", error }, "Failed to process image variant");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  let imageId: string | undefined;
  try {
    const { slug } = await params;
    imageId = slug;
    logger.info({ route: "/api/v1/image/[slug]", method: "DELETE", imageId }, "Incoming image delete request");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logger.warn({ route: "/api/v1/image/[slug]", method: "DELETE", imageId }, "Unauthorized request: Invalid or missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawApiKey = authHeader.slice("Bearer ".length).trim();
    if (!rawApiKey || !rawApiKey.startsWith("pk_")) {
      logger.warn({ route: "/api/v1/image/[slug]", method: "DELETE", imageId }, "Unauthorized request: Invalid API key format");
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
      logger.warn({ route: "/api/v1/image/[slug]", method: "DELETE", imageId }, "Unauthorized request: API key not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canDelete = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("DELETE");
    if (!canDelete) {
      logger.warn(
        { route: "/api/v1/image/[slug]", method: "DELETE", imageId, appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Forbidden request: API key lacks required scope"
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        appId: apiKey.app.id,
      },
      select: {
        id: true,
        slug: true,
        options: true,
        variants: {
          select: {
            options: true,
          },
        },
      },
    });

    if (!image) {
      logger.warn(
        { route: "/api/v1/image/[slug]", method: "DELETE", imageId, appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Image not found for deletion"
      );
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete original from R2
    const objectKey = getImageObjectKey(image.options);
    if (objectKey) {
      try {
        await deleteR2ObjectIfPossible(objectKey);
      } catch (error) {
        logger.warn({ route: "/api/v1/image/[slug]", method: "DELETE", imageId: image.id, objectKey, error }, "Failed to delete original image object from R2");
      }
    }

    // Delete variants from R2
    for (const variant of image.variants) {
      const variantKey = getImageObjectKey(variant.options);
      if (variantKey) {
        try {
          await deleteR2ObjectIfPossible(variantKey);
        } catch (error) {
          logger.warn({ route: "/api/v1/image/[slug]", method: "DELETE", imageId: image.id, variantKey, error }, "Failed to delete variant image object from R2");
        }
      }
    }

    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    logger.info(
      {
        route: "/api/v1/image/[slug]",
        method: "DELETE",
        imageId: image.id,
        slug: image.slug,
        appId: apiKey.app.id,
        tenantId: apiKey.app.tenantId,
      },
      "Successfully deleted image and its variants"
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
    logger.error({ route: "/api/v1/image/[slug]", method: "DELETE", imageId, error }, "Failed to delete image");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}