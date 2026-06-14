const rateLimit = require("express-rate-limit");

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;

const globalLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
  skip: (req) => req.method === "OPTIONS",
});

const authLimiter = rateLimit({
  windowMs,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again later." },
  skipSuccessfulRequests: true,
});

module.exports = { globalLimiter, authLimiter };
