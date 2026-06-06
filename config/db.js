const mongoose = require("mongoose");

const connectDB = async () => {
  const maxPoolSize = Number(process.env.MONGO_MAX_POOL_SIZE) || 25;
  const minPoolSize = Number(process.env.MONGO_MIN_POOL_SIZE) || 5;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize,
      minPoolSize,
      maxIdleTimeMS: 30_000,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      retryWrites: true,
      w: "majority",
    });

    console.log(
      `MongoDB connected (pool: ${minPoolSize}–${maxPoolSize} connections)`,
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

module.exports = connectDB;
