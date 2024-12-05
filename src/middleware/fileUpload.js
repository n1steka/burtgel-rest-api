import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 50 * 1024 * 1024, // 50MB limit
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldNameSize: 10000, // Limit field name size to 100 bytes
  },
});

export default upload;
