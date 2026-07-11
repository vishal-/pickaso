import crypto from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";
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
  logger.info({ route: "/api/v1/upload", method: "POST" }, "Incoming upload request");

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

    const canUpload = apiKey.scopes.includes("ALL") || apiKey.scopes.includes("WRITE");
    if (!canUpload) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    const imagePart = formData.get("image");
    if (!(imagePart instanceof File)) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }

    const collectionPart = formData.get("collection");
    const requestedCollection = typeof collectionPart === "string" && collectionPart.trim().length > 0
      ? collectionPart.trim()
      : "default";

    if (!COLLECTION_NAME_PATTERN.test(requestedCollection)) {
      return NextResponse.json(
        { error: "collection must be lowercase alphanumeric only" },
        { status: 400 }
      );
    }

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

    const inputBuffer = Buffer.from(await imagePart.arrayBuffer());
    const sourceImage = sharp(inputBuffer, { failOn: "error" }).rotate();
    const sourceMetadata = await sourceImage.metadata();
    const outputSpec = getOutputSpec(sourceMetadata.format);

    if (!outputSpec) {
      return NextResponse.json({ error: "Unsupported image format" }, { status: 400 });
    }

    // Re-encoding strips EXIF and other metadata while preserving image format.
    const outputBuffer = await outputSpec.encode(sourceImage).toBuffer();
    const finalMetadata = await sharp(outputBuffer).metadata();

    const width = finalMetadata.width;
    const height = finalMetadata.height;

    if (!width || !height) {
      return NextResponse.json({ error: "Invalid image dimensions" }, { status: 400 });
    }

    const imageId = crypto.randomUUID();
    const slug = `img_${createCuidLikeId()}`;
    const objectName = `${imageId}.${outputSpec.extension}`;
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

    logger.info(
      {
        route: "/api/v1/upload",
        method: "POST",
        imageId: image.id,
        tenantId: apiKey.app.tenantId,
        appId: apiKey.app.id,
        collection: image.collection.name,
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