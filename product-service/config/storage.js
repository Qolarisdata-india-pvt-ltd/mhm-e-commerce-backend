import path from "node:path";
import fs from "node:fs/promises";
import dotenv from "dotenv";

dotenv.config();

/**
 * Pluggable upload storage.
 *
 * Driver selection:
 *   - STORAGE_DRIVER (local | minio) wins if set.
 *   - Otherwise: minio when NODE_ENV === "production", else local.
 *
 * Local driver writes to <UPLOAD_DIR>/<bucket>/<object> (folders created on
 * demand) and returns ${PUBLIC_BASE_URL}/uploads/<bucket>/<object>.
 * MinIO driver preserves the previous behaviour and only loads the minio
 * client when actually used.
 */
const resolveDriver = () => {
  const explicit = (process.env.STORAGE_DRIVER || "").trim().toLowerCase();
  if (explicit === "local" || explicit === "minio") return explicit;
  return process.env.NODE_ENV === "production" ? "minio" : "local";
};

const DRIVER = resolveDriver();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");

export const isLocal = () => DRIVER === "local";
export const uploadDir = UPLOAD_DIR;

// ---- local driver ----
const localEnsureBucket = async (bucket) => {
  await fs.mkdir(path.join(UPLOAD_DIR, bucket), { recursive: true });
};

const localSaveObject = async (bucket, objectName, buffer) => {
  await localEnsureBucket(bucket);
  await fs.writeFile(path.join(UPLOAD_DIR, bucket, objectName), buffer);
  return `${PUBLIC_BASE_URL}/uploads/${bucket}/${objectName}`;
};

// ---- minio driver (lazy) ----
let minioClient = null;
const getMinioClient = async () => {
  if (!minioClient) {
    const { Client } = await import("minio");
    minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: Number(process.env.MINIO_PORT),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
  }
  return minioClient;
};

const minioEnsureBucket = async (bucket) => {
  const client = await getMinioClient();
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket, "us-east-1");
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    await client.setBucketPolicy(bucket, JSON.stringify(policy));
  }
};

const minioSaveObject = async (bucket, objectName, buffer, contentType) => {
  const client = await getMinioClient();
  await client.putObject(bucket, objectName, buffer, buffer.length, {
    "Content-Type": contentType,
  });
  return `${process.env.MINIO_BUCKET_URL}/${bucket}/${objectName}`;
};

/** Create the bucket/folder if it does not exist. */
export const ensureBucket = async (bucket) => {
  if (isLocal()) return localEnsureBucket(bucket);
  return minioEnsureBucket(bucket);
};

/** Store a buffer and return its public URL. */
export const saveObject = async (bucket, objectName, buffer, contentType) => {
  if (isLocal()) return localSaveObject(bucket, objectName, buffer);
  return minioSaveObject(bucket, objectName, buffer, contentType);
};
