import "dotenv/config";
import express from "express";
import sequelize from "./config/db.js";
import productRoutes from "./routes/product.routes.js";

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

app.listen(process.env.PORT || 5002, () => {
  console.log(`Product Service running on port ${process.env.PORT || 5002}`);
});
