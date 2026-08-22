import crypto from "node:crypto";

const internalAuth = (req, res, next) => {
  const internalToken = req.headers["x-internal-token"];
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    console.error("INTERNAL_API_KEY is not configured on product-service");
    return res.status(500).json({
      message: "Server misconfiguration: INTERNAL_API_KEY is missing.",
    });
  }

  if (!internalToken || typeof internalToken !== "string") {
    return res
      .status(401)
      .json({ message: "Access Denied. No internal token provided." });
  }

  try {
    const tokenBuffer = Buffer.from(internalToken);
    const expectedBuffer = Buffer.from(expectedKey);

    if (
      tokenBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
    ) {
      return res.status(403).json({ message: "Forbidden. Invalid internal token." });
    }

    req.isInternal = true;
    next();
  } catch (err) {
    console.error("Internal Auth Error:", err);
    return res.status(403).json({ message: "Forbidden. Token validation error." });
  }
};

export default internalAuth;
