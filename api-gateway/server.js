import "dotenv/config";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "./config/redis.js";
import crypto from "node:crypto";

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const USER_SERVICE_URL = requireEnv("USER_SERVICE_URL");
const CART_SERVICE_URL = requireEnv("CART_SERVICE_URL");
const ORDER_SERVICE_URL = requireEnv("ORDER_SERVICE_URL");
const PRODUCT_SERVICE_URL = requireEnv("PRODUCT_SERVICE_URL");
const ADMIN_SERVICE_URL = requireEnv("ADMIN_SERVICE_URL");
const VENDOR_SERVICE_URL = requireEnv("VENDOR_SERVICE_URL");
const VENDOR_SERVICE_ADMIN_URL = requireEnv("VENDOR_SERVICE_ADMIN_URL");
const ADDRESS_SERVICE_URL = requireEnv("ADDRESS_SERVICE_URL");

const isDev = process.env.NODE_ENV !== "production";
const frontendOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  (isDev ? "http://localhost:5174" : "")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (frontendOrigins.length === 0) {
  throw new Error(
    "Missing FRONTEND_URL or FRONTEND_URLS. Set your staging frontend origin(s).",
  );
}

const trustedRateLimitIps = (
  process.env.RATE_LIMIT_TRUSTED_IPS || (isDev ? "127.0.0.1,::1" : "")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// Required when gateway runs behind nginx/load balancer (sets X-Forwarded-For).
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === "true" || trustProxy === "1") {
  app.set("trust proxy", 1);
} else if (trustProxy && trustProxy !== "false" && trustProxy !== "0") {
  // e.g. TRUST_PROXY=2 for two proxy hops
  app.set("trust proxy", Number(trustProxy) || 1);
} else if (!isDev) {
  // Default on for staging/production behind a reverse proxy
  app.set("trust proxy", 1);
}

app.use(helmet());

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin) and configured frontends
    if (!origin || frontendOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  message: {
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  skip: (req) => trustedRateLimitIps.includes(req.ip),
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => res.statusCode < 400,
  message: {
    message: "Too many login attempts from this IP, please try again later.",
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "rl_auth:",
  }),
});

app.use(globalLimiter);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/vendor/login", authLimiter);
app.use("/api/admin/login", authLimiter);

const proxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    proxyTimeout: Number(process.env.PROXY_TIMEOUT_MS || 10000),
    timeout: Number(process.env.PROXY_TIMEOUT_MS || 10000),
    pathRewrite: (_path, req) => {
      const full = req.originalUrl || req.url || "/";
      return full.split("?")[0];
    },
    onProxyReq: (proxyReq, req) => {
      const correlationId =
        req.headers["x-correlation-id"] || crypto.randomUUID();
      proxyReq.setHeader("x-correlation-id", correlationId);
    },
    onError: (err, req, res) => {
      console.error(`[Gateway Error] connecting to ${target}:`, err.message);
      if (res.headersSent) return;
      if (
        err.code === "ECONNRESET" ||
        err.code === "ETIMEDOUT" ||
        err.message.includes("timeout")
      ) {
        return res.status(504).json({
          message:
            "Gateway Timeout: The underlying microservice took too long to respond.",
        });
      }
      res.status(502).json({
        message: "Bad Gateway: Underlying service is down or unreachable.",
      });
    },
  });
};

app.use("/api/admin/users", proxy(USER_SERVICE_URL));
app.use("/api/admin/vendors", proxy(VENDOR_SERVICE_ADMIN_URL));
app.use("/api/admin", proxy(ADMIN_SERVICE_URL));
app.use("/api/payment", proxy(ORDER_SERVICE_URL));
app.use("/api/orders", proxy(ORDER_SERVICE_URL));
app.use("/api/addresses", proxy(ADDRESS_SERVICE_URL));
app.use("/api/auth", proxy(USER_SERVICE_URL));
app.use("/api/products", proxy(PRODUCT_SERVICE_URL));
app.use("/api/cart", proxy(CART_SERVICE_URL));
app.use("/api/vendor", proxy(VENDOR_SERVICE_URL));

app.use((req, res) => {
  res
    .status(404)
    .json({ message: "Gateway Error: Requested endpoint does not exist." });
});

app.use((err, req, res, next) => {
  console.error("Critical Gateway Error:", err.stack);
  res
    .status(500)
    .json({ message: "API Gateway encountered an internal error." });
});

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`CORS origins: ${frontendOrigins.join(", ")}`);
});
