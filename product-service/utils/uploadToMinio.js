import sharp from "sharp";
import * as storage from "../config/storage.js";

const BUCKET_NAME = "products";

export const uploadImageToMinio = async (file) => {
  await storage.ensureBucket(BUCKET_NAME);

  const objectName = `${Date.now()}-${file.originalname.split(" ").join("_")}.webp`;

  const optimizedBuffer = await sharp(file.buffer)
    .resize(1000, 1000, { fit: "inside" })
    .webp({ quality: 75 })
    .toBuffer();

  return storage.saveObject(BUCKET_NAME, objectName, optimizedBuffer, "image/webp");
};
