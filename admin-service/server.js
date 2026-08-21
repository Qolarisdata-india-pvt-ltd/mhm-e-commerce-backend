import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import sequelize, { connectDB } from "./config/db.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());

app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled Application Error:", err.stack);
  res.status(500).json({
    message: "An unexpected internal error occurred",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  });
});

const startServer = async () => {
  try {
    await connectDB();
    console.log("Models synced successfully");
    const port = process.env.PORT || 5005;
    app.listen(port, () => {
      console.log(`Admin Service running on port ${port}`);
    });
  } catch (error) {
    console.error("Server error:", error);
  }
};

startServer();
