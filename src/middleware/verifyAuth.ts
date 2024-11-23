import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserJwtPayload } from "../types/jwt.js";

const verifyAuth = (req: Request, res: Response, next: NextFunction): any => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      errors: [{ message: "Unauthorized" }],
    });
  }
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log("JWT secret is not defined");
      return res.status(500).json({
        errors: [
          { message: "Internal server error - cannot authorize any users" },
        ],
      });
    }
    const user = jwt.verify(token, jwtSecret);
    // console.log("verifying jwt user", user);
    if (!user) {
      return res.status(401).json({
        errors: [{ message: "Unauthorized user" }],
      });
    }
    req.user = user as UserJwtPayload;
    next();
  } catch (error) {
    res.clearCookie("token");
    return res.sendStatus(401);
  }
};

const adminOnlyVerify = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({
      errors: [{ message: "You do not have permission to access this route" }],
    });
  }
};

const adminAndUserOnlyVerify = (
  req: Request<{ userId: string }, {}, { userId: string }>,
  res: Response,
  next: NextFunction
): any => {
  const userId = req.body.userId || req.params.userId;
  if (req.user && (req.user.isAdmin || req.user.id === userId)) {
    next();
  } else {
    return res.status(403).json({
      errors: [{ message: "You do not have permission to access this route" }],
    });
  }
};

export { verifyAuth, adminOnlyVerify, adminAndUserOnlyVerify };
