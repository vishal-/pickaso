import crypto from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";
import slugify from "@sindresorhus/slugify";
import { customAlphabet } from "nanoid";
import logger from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const COLLECTION_NAME_PATTERN = /^[a-z0-9]+$/;

type OutputSpec = {
  extension: string;
  mimeType: string;
  encode: (image: ReturnType<typeof sharp>) => ReturnType<typeof sharp>;
};

function getOutputSpec(format: string | undefined): OutputSpec | null {
  switch (format) {
    case "jpeg":
      return {
        extension: "jpg",
        mimeType: "image/jpeg",
        encode: (image) => image.jpeg({ quality: 90 }),
      };
    case "png":
      return {
        extension: "png",
        mimeType: "image/png",
        encode: (image) => image.png({ compressionLevel: 9 }),
      };
    case "webp":
      return {
        extension: "webp",
        mimeType: "image/webp",
        encode: (image) => image.webp({ quality: 90 }),
      };
    case "avif":
      return {
        extension: "avif",
        mimeType: "image/avif",
        encode: (image) => image.avif({ quality: 70 }),
      };
    case "tiff":
      return {
        extension: "tiff",
        mimeType: "image/tiff",
        encode: (image) => image.tiff({ quality: 90 }),
      };
    default:
      return null;
  }
}

function createCuidLikeId(): string {
  const ts = Date.now().toString(36);
  const random = crypto.randomBytes(10).toString("hex");
  return `${ts}${random}`.slice(0, 24);
}

const NANOID_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateSlug(originalName: string): string {
  let baseName = originalName;
  const lastDotIndex = originalName.lastIndexOf(".");
  if (lastDotIndex !== -1) {
    baseName = originalName.substring(0, lastDotIndex);
  }

  const slugified = slugify(baseName, { separator: "" });
  const cleanName = slugified.slice(0, 12);

  const nanoidLength = 24 - cleanName.length;
  const generateNanoid = customAlphabet(NANOID_ALPHABET, nanoidLength);
  const nanoidPart = generateNanoid();

  return `${cleanName}${nanoidPart}`;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toPublicUrl(baseUrl: string, objectPath: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = objectPath.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedPath}`;
}

export async function POST(request: Request) {
  const startTime = performance.now();
  logger.info({ route: "/api/v1/upload", method: "POST" }, "Incoming upload request");

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logger.warn({ route: "/api/v1/upload", method: "POST" }, "Unauthorized request: Invalid or missing authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawApiKey = authHeader.slice("Bearer ".length).trim();
    if (!rawApiKey || !rawApiKey.startsWith("pk_")) {
      logger.warn({ route: "/api/v1/upload", method: "POST" }, "Unauthorized request: Invalid API key format");
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
    const t_apiKey = performance.now();

    if (!apiKey) {
      logger.warn({ route: "/api/v1/upload", method: "POST" }, "Unauthorized request: API key not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpload = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("WRITE");
    if (!canUpload) {
      logger.warn(
        { route: "/api/v1/upload", method: "POST", appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Forbidden request: API key lacks required scope"
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      logger.warn(
        { route: "/api/v1/upload", method: "POST", appId: apiKey.app.id, tenantId: apiKey.app.tenantId, contentType },
        "Bad Request: Content-Type must be multipart/form-data"
      );
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    const imagePart = formData.get("image");
    if (!(imagePart instanceof File)) {
      logger.warn(
        { route: "/api/v1/upload", method: "POST", appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Bad Request: image is required"
      );
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }

    const collectionPart = formData.get("collection");
    const requestedCollection = typeof collectionPart === "string" && collectionPart.trim().length > 0
      ? collectionPart.trim()
      : "default";

    if (!COLLECTION_NAME_PATTERN.test(requestedCollection)) {
      logger.warn(
        { route: "/api/v1/upload", method: "POST", appId: apiKey.app.id, tenantId: apiKey.app.tenantId, collection: requestedCollection },
        "Bad Request: collection must be lowercase alphanumeric only"
      );
      return NextResponse.json(
        { error: "collection must be lowercase alphanumeric only" },
        { status: 400 }
      );
    }
    const t_formData = performance.now();

    let collection = await prisma.collection.findFirst({
      where: {
        appId: apiKey.app.id,
        name: requestedCollection,
      },
    });

    if (!collection) {
      collection = await prisma.collection.create({
        data: {
          name: requestedCollection,
          appId: apiKey.app.id,
        },
      });
    }
    const t_collection = performance.now();

    const inputBuffer = Buffer.from(await imagePart.arrayBuffer());
    const sourceImage = sharp(inputBuffer, { failOn: "error" }).rotate();
    const sourceMetadata = await sourceImage.metadata();
    const outputSpec = getOutputSpec(sourceMetadata.format);

    if (!outputSpec) {
      logger.warn(
        { route: "/api/v1/upload", method: "POST", appId: apiKey.app.id, tenantId: apiKey.app.tenantId, format: sourceMetadata.format },
        "Bad Request: Unsupported image format"
      );
      return NextResponse.json({ error: "Unsupported image format" }, { status: 400 });
    }

    let width = sourceMetadata.width;
    let height = sourceMetadata.height;

    // If orientation indicates a 90 or 270 degree rotation, swap width and height
    const orientation = sourceMetadata.orientation;
    if (orientation && orientation >= 5 && orientation <= 8 && width && height) {
      const temp = width;
      width = height;
      height = temp;
    }

    if (!width || !height) {
      logger.warn(
        { route: "/api/v1/upload", method: "POST", appId: apiKey.app.id, tenantId: apiKey.app.tenantId },
        "Bad Request: Invalid image dimensions"
      );
      return NextResponse.json({ error: "Invalid image dimensions" }, { status: 400 });
    }

    // Re-encoding strips EXIF and other metadata while preserving image format.
    const outputBuffer = await outputSpec.encode(sourceImage).toBuffer();
    const t_sharp = performance.now();

    const imageId = crypto.randomUUID();
    const slug = generateSlug(imagePart.name || "image");
    const objectName = `${slug}.${outputSpec.extension}`;
    const objectKey = `${apiKey.app.tenantId}/${objectName}`;

    const r2AccountId = getRequiredEnv("R2_ACCOUNT_ID");
    const r2AccessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
    const r2SecretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");
    const r2Bucket = getRequiredEnv("R2_BUCKET");
    const r2PublicBaseUrl = getRequiredEnv("R2_PUBLIC_BASE_URL");

    const r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });

    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: objectKey,
        Body: outputBuffer,
        ContentType: outputSpec.mimeType,
      })
    );
    const t_r2 = performance.now();

    const publicUrl = toPublicUrl(r2PublicBaseUrl, objectKey);

    const image = await prisma.image.create({
      data: {
        id: imageId,
        slug,
        originalName: imagePart.name || objectName,
        mimeType: outputSpec.mimeType,
        format: outputSpec.extension,
        width,
        height,
        size: outputBuffer.byteLength,
        options: {
          bucket: r2Bucket,
          key: objectKey,
          url: publicUrl,
        },
        tenantId: apiKey.app.tenantId,
        appId: apiKey.app.id,
        collectionId: collection.id,
      },
      include: {
        collection: {
          select: {
            name: true,
          },
        },
      },
    });
    const t_db = performance.now();

    logger.info(
      {
        route: "/api/v1/upload",
        method: "POST",
        imageId: image.id,
        tenantId: apiKey.app.tenantId,
        appId: apiKey.app.id,
        collection: image.collection.name,
        timings: {
          apiKeyLookup: Math.round(t_apiKey - startTime),
          formDataParse: Math.round(t_formData - t_apiKey),
          collectionDb: Math.round(t_collection - t_formData),
          sharpProcessing: Math.round(t_sharp - t_collection),
          r2Upload: Math.round(t_r2 - t_sharp),
          imageDbCreate: Math.round(t_db - t_r2),
          total: Math.round(t_db - startTime),
        },
      },
      "Image uploaded successfully"
    );

    return NextResponse.json(
      {
        id: image.id,
        name: image.slug,
        url: publicUrl,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        size: image.size,
        collection: image.collection.name,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ route: "/api/v1/upload", method: "POST", error }, "Upload failed");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}