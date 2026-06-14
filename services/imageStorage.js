const path = require("path");
const fs = require("fs");
const {
  isCloudinaryEnabled,
  getCloudinary,
  CLOUDINARY_FOLDER,
} = require("../config/cloudinary");
const { UPLOAD_DIR } = require("../middleware/uploadMiddleware");

const isRemoteImage = (imageUrl) =>
  typeof imageUrl === "string" &&
  (imageUrl.startsWith("https://") || imageUrl.startsWith("http://"));

exports.storeUploadedFile = async (file) => {
  if (isCloudinaryEnabled()) {
    const cloudinary = getCloudinary();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDER,
          resource_type: "image",
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        },
      );

      stream.end(file.buffer);
    });

    return {
      imageUrl: result.secure_url,
      imageFilename: result.public_id,
    };
  }

  return {
    imageUrl: `/uploads/${file.filename}`,
    imageFilename: file.filename,
  };
};

exports.deleteStoredImage = async (output) => {
  if (!output?.imageFilename) return;

  if (isRemoteImage(output.imageUrl)) {
    if (!isCloudinaryEnabled()) return;

    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(output.imageFilename);
    return;
  }

  const filePath = path.join(UPLOAD_DIR, output.imageFilename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

exports.deleteStoredImages = async (outputs) => {
  await Promise.all(
    outputs.map((output) =>
      exports.deleteStoredImage(output).catch(() => {}),
    ),
  );
};
