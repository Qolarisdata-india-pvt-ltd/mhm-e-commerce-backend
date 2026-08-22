import "dotenv/config";
import express from "express";
import sequelize from "./config/db.js";
import productRoutes from "./routes/product.routes.js";

const requiredEnv = ["JWT_SECRET", "INTERNAL_API_KEY"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/products", productRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled Product Service Error:", err.stack);
  res.status(500).json({
    message: "An internal server error occurred",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  });
});

const startServer = async () => {
  await sequelize.authenticate();
  const port = process.env.PORT || 5002;
  app.listen(port, () => {
    console.log(`Product Service running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Product service failed to start:", error.message);
  process.exit(1);
});
