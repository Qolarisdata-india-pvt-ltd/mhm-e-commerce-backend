import fs from "node:fs";
import minioClient from "../config/minio.js";
import { localProductImagePath } from "../utils/uploadToMinio.js";

const sendStoredFile = (res, objectName) => {
  const filePath = localProductImagePath(objectName);
  if (!fs.existsSync(filePath)) return false;
  res.setHeader("Content-Type", "image/webp");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  fs.createReadStream(filePath).pipe(res);
  return true;
};

export const streamProductImage = async (req, res) => {
  const objectName = req.params.objectName;
  if (
    !objectName ||
    objectName.includes("..") ||
    objectName.includes("/") ||
    objectName.includes("\\")
  ) {
    return res.status(400).json({ message: "Invalid image name" });
  }

  if (sendStoredFile(res, objectName)) return;

  try {
    const stream = await minioClient.getObject("products", objectName);
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ message: "Image not found" });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  } catch {
    return res.status(404).json({ message: "Image not found" });
  }
};
