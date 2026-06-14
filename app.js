const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const mongoose = require("mongoose");
const { globalLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(compression());

  const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === "production") {
    console.log("CORS allowed origins:", allowedOrigins.join(", ") || "(none)");
  }

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin tools (curl, Postman) or server-to-server — no Origin header
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        console.warn(`CORS blocked request from origin: ${origin}`);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 204,
    }),
  );

  app.use(express.json({ limit: "10kb" }));
  app.use(globalLimiter);

  app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"), {
      maxAge: "7d",
      immutable: true,
    }),
  );

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/ready", (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    if (!dbReady) {
      return res.status(503).json({ status: "not ready", db: "disconnected" });
    }
    res.status(200).json({ status: "ready", db: "connected" });
  });

  app.get("/", (req, res) => {
    res.json({ message: "LabFlow API", version: "1.0.0" });
  });

  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/stats", require("./routes/statsRoutes"));
  app.use("/api/subjects", require("./routes/subjectRoutes"));
  app.use("/api/reports", require("./routes/labReportRoutes"));
  app.use("/api/shared/reports", require("./routes/sharedReportRoutes"));
  app.use("/api/outputs", require("./routes/labOutputRoutes"));
  app.use("/api/search", require("./routes/searchRoutes"));

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
