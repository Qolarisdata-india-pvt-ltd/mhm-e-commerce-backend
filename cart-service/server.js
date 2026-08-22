import "dotenv/config";
import express from "express";
import sequelize from "./config/db.js";
import cartRoutes from "./routes/cart.routes.js";

const requiredEnv = ["JWT_SECRET", "PRODUCT_SERVICE_URL", "INTERNAL_API_KEY"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const app = express();
app.disable("x-powered-by");
app.use(express.json());

app.use("/api/cart", cartRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled Cart Service Error:", err.stack);
  res.status(500).json({
    message: "An internal server error occurred",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  });
});

const startServer = async () => {
  await sequelize.authenticate();
  const port = process.env.PORT || 5003;
  app.listen(port, () => {
    console.log(`Cart Service running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Cart service failed to start:", error.message);
  process.exit(1);
});
