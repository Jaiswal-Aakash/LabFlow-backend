const required = ["MONGO_URI", "JWT_SECRET"];
const { isCloudinaryEnabled } = require("./cloudinary");

const validateMongoUri = (uri) => {
  // mongodb+srv://user:pass@host/db — auth must contain user:password
  const match = uri.match(/^mongodb(\+srv)?:\/\/([^/]+)/);
  if (!match) return;

  const auth = match[2].split("@")[0];
  if (!auth.includes(":") || auth.endsWith(":") || auth.split(":")[1] === "") {
    console.error(`
MongoDB connection string is missing a password.

Your MONGO_URI should look like:
  mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/labflow

Get the full URI from MongoDB Atlas:
  Database → Connect → Drivers → copy connection string
  Replace <password> with your database user password.

If your password contains special characters (@ : / # ?), URL-encode them.
  Example: p@ss:word → p%40ss%3Aword
`);
    process.exit(1);
  }
};

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  validateMongoUri(process.env.MONGO_URI);

  if (process.env.JWT_SECRET.length < 32) {
    console.warn(
      "Warning: JWT_SECRET should be at least 32 characters for production.",
    );
  }

  if (process.env.NODE_ENV === "production" && !isCloudinaryEnabled()) {
    console.warn(`
Warning: Cloudinary is not configured (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
Uploaded images will be stored on local disk, which is lost on redeploy unless you use persistent volumes.
Configure Cloudinary for production deployments.
`);
  }
};

module.exports = { validateEnv };

