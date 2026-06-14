const fs = require("fs");
const path = require("path");
const { UPLOAD_DIR } = require("../middleware/uploadMiddleware");

const readLocalFile = (filename) => {
  if (!filename) return null;

  const safeName = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeName);

  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }

  return null;
};

const extractUploadsFilename = (imageUrl) => {
  if (!imageUrl) return null;

  const match = String(imageUrl).match(/\/uploads\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const fetchImageBuffer = async (imageUrl, imageFilename) => {
  if (!imageUrl && !imageFilename) {
    throw new Error("Missing image URL");
  }

  const localCandidates = [
    extractUploadsFilename(imageUrl),
    imageFilename && !String(imageFilename).includes("/")
      ? imageFilename
      : null,
  ].filter(Boolean);

  for (const name of localCandidates) {
    const local = readLocalFile(name);
    if (local) return local;
  }

  let remoteUrl = imageUrl;

  if (remoteUrl && remoteUrl.startsWith("/uploads/")) {
    throw new Error("Image file not found on server");
  }

  if (remoteUrl && remoteUrl.includes("/uploads/")) {
    const localFromUrl = readLocalFile(extractUploadsFilename(remoteUrl));
    if (localFromUrl) return localFromUrl;

    try {
      const parsed = new URL(remoteUrl);
      remoteUrl = `${parsed.pathname}${parsed.search}`;
      if (remoteUrl.startsWith("/uploads/")) {
        const localFromPath = readLocalFile(extractUploadsFilename(remoteUrl));
        if (localFromPath) return localFromPath;
        throw new Error("Image file not found on server");
      }
    } catch {
      // keep original remoteUrl
    }
  }

  if (
    remoteUrl &&
    (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://"))
  ) {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image (${response.status})`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("Unable to resolve image source");
};

module.exports = fetchImageBuffer;
