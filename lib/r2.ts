import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import logger from "./logger";

let r2Client: S3Client | null = null;

export function getOptionalEnv(name: string): string | null {
  return process.env[name] ?? null;
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getR2Client(): S3Client | null {
  if (r2Client) {
    return r2Client;
  }

  const r2AccountId = getOptionalEnv("R2_ACCOUNT_ID");
  const r2AccessKeyId = getOptionalEnv("R2_ACCESS_KEY_ID");
  const r2SecretAccessKey = getOptionalEnv("R2_SECRET_ACCESS_KEY");

  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    return null;
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  return r2Client;
}

export async function deleteR2ObjectIfPossible(objectKey: string): Promise<void> {
  const r2Bucket = getOptionalEnv("R2_BUCKET");
  const client = getR2Client();

  if (!client || !r2Bucket) {
    return;
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: r2Bucket,
        Key: objectKey,
      })
    );
  } catch (error) {
    logger.warn({ objectKey, error }, "Failed to delete object from R2");
    throw error;
  }
}
