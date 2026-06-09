/**
 * PM2 process definitions for the MHM e-commerce backend (UAT).
 *
 * Start everything:   pm2 start ecosystem.config.cjs
 * Reload everything:  pm2 reload ecosystem.config.cjs
 * Status / logs:      pm2 status   |   pm2 logs
 * Persist on reboot:  pm2 save && pm2 startup
 *
 * PORT and NODE_ENV are injected here (operational concern).
 * All other config (DB / Redis / MinIO / Razorpay / secrets / *_SERVICE_URL)
 * comes from each service's own .env file — copy .env.example to .env first.
 */
const path = require("path");

const svc = (name, dir, port) => ({
  name,
  cwd: path.resolve(__dirname, dir),
  script: "server.js",
  exec_mode: "fork",
  instances: 1,
  autorestart: true,
  max_restarts: 10,
  watch: false,
  env: {
    NODE_ENV: "production",
    PORT: String(port),
  },
});

module.exports = {
  apps: [
    // Start data/dependency services before the gateway.
    // NOTE: 5001 is already used by citizen-uat on this shared server, so
    // user-service runs on 6001 instead. Keep USER_SERVICE_URL in sync.
    svc("user-service", "user-service", 6001),
    svc("product-service", "product-service", 5002),
    svc("cart-service", "cart-service", 5003),
    svc("order-service", "order-service", 5004),
    svc("admin-service", "admin-service", 5005),
    svc("vendor-service", "vendor-service", 5006),
    svc("api-gateway", "api-gateway", 5007),
  ],
};
