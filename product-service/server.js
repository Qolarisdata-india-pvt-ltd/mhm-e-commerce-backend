import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import productRoutes from "./routes/product.routes.js";
import * as storage from "./config/storage.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve locally-stored uploads when the local storage driver is active.
if (storage.isLocal()) {
  app.use("/uploads", express.static(storage.uploadDir));
}

app.use("/api/products", productRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled Vendor Service Error:", err.stack);
  res.status(500).json({
    message: "An internal server error occurred",
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});


console.log("Product DB connected");


app.listen(5002, () => {
  console.log("Product Service running on port 5002");
});