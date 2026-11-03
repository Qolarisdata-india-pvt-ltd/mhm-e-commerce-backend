import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import minioClient from "../config/minio.js";
import dotenv from "dotenv";

dotenv.config();

const uploadDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../uploads/products",
);

export const localProductImagePath = (objectName) =>
  path.join(uploadDir, objectName);

const publicMediaUrl = (objectName) => {
  const publicApi = (process.env.PUBLIC_API_URL || "http://localhost:5007").replace(
    /\/$/,
    "",
  );
  return `${publicApi}/api/products/media/${encodeURIComponent(objectName)}`;
};

const minioIsLocal = () =>
  ["localhost", "127.0.0.1"].includes(
    String(process.env.MINIO_ENDPOINT || "").trim(),
  );

const saveLocalImage = async (objectName, buffer) => {
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(localProductImagePath(objectName), buffer);
};

const storeInMinio = async (bucketName, objectName, buffer) => {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "us-east-1");

    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: ["s3:GetObject"],
          Effect: "Allow",
          Principal: "*",
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`Bucket '${bucketName}' created and set to public.`);
  }

  await minioClient.putObject(bucketName, objectName, buffer, buffer.length, {
    "Content-Type": "image/webp",
  });
};

export const uploadImageToMinio = async (file) => {
  const bucketName = "products";
  const objectName = `${Date.now()}-${file.originalname.split(" ").join("_")}.webp`;
  const optimizedBuffer = await sharp(file.buffer)
    .resize(1000, 1000, { fit: "inside" })
    .webp({ quality: 75 })
    .toBuffer();

  try {
    await storeInMinio(bucketName, objectName, optimizedBuffer);
  } catch (err) {
    if (!minioIsLocal()) throw err;
    console.error("MinIO is not reachable. Saving the product image locally.");
    await saveLocalImage(objectName, optimizedBuffer);
    return publicMediaUrl(objectName);
  }

  const bucketUrl = (process.env.MINIO_BUCKET_URL || "").replace(/\/$/, "");
  const loopback = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(
    bucketUrl,
  );
  const publicApi = (process.env.PUBLIC_API_URL || "").replace(/\/$/, "");
  if (loopback && publicApi) {
    return `${publicApi}/api/products/media/${encodeURIComponent(objectName)}`;
  }

  return `${bucketUrl}/${bucketName}/${objectName}`;
};