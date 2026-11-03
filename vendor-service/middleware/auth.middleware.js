import jwt from "jsonwebtoken";
import redis from "../config/redis.js"; 

const readToken = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    const bearer = header.slice(7).trim();
    if (bearer) return bearer;
  }
  return req.cookies.jwt || "";
};

const authMiddleware = async (req, res, next) => {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ message: "Authentication required. Please log in." });
  }

  try {
    if (redis.status === "ready") {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({ 
          message: "Session expired (Logged out). Please login again." 
        });
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (err) {
    console.error("Authentication Error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;