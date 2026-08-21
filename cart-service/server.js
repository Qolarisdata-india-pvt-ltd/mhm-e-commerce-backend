import "dotenv/config";
import express from "express";
import sequelize from "./config/db.js";
import cartRoutes from "./routes/cart.routes.js";

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

app.listen(process.env.PORT || 5003, () => {
  console.log(`Cart Service running on port ${process.env.PORT || 5003}`);
});
