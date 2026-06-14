const errorHandler = (err, req, res, next) => {
  if (err?.message?.includes("CORS")) {
    return res.status(403).json({ message: "Not allowed by CORS" });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  if (statusCode === 500) {
    console.error(`[${req.method}] ${req.originalUrl}`, err);
  }

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
