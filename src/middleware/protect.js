import jwt from "jsonwebtoken";
import asyncHandler from "../middleware/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        msg: "Please login first",
      });
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        success: false,
        msg: "Token is missing",
      });
    }
    const tokenObj = jwt.verify(token, process.env.ACCESS_TOKEN);
    console.log("tokenObj", tokenObj);
    req.user = {
      id: tokenObj.id,
      role: tokenObj.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      msg: "Invalid token. Please log in again.",
    });
  }
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: `You do not have permission to perform this action. Your role is [${req.user.role}].`,
      });
    }
    next();
  };
};
