const cloudinary = require("cloudinary").v2;

const isCloudinaryEnabled = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const getCloudinary = () => {
  if (!isCloudinaryEnabled()) {
    return null;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
};

module.exports = {
  isCloudinaryEnabled,
  getCloudinary,
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || "labflow",
};
