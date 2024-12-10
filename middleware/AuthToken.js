const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token)
    return res.status(403).json({ code: 403, message: "Token required" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ code: 401, message: "Invalid or expired token" });
  }
};
