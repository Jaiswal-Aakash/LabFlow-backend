require("dotenv").config();

const mongoose = require("mongoose");
const createApp = require("./app");
const connectDB = require("./config/db");
const { validateEnv } = require("./config/env");
const { isCloudinaryEnabled } = require("./config/cloudinary");

validateEnv();

const startServer = async () => {
  await connectDB();

  const app = createApp();
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    const storage = isCloudinaryEnabled() ? "Cloudinary" : "local disk";
    console.log(
      `Worker ${process.pid} listening on port ${PORT} [${process.env.NODE_ENV || "development"}] — images: ${storage}`,
    );
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close(false);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
