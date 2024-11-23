import { Request } from "express";
import ApiDataLayer from "../db/services/apiDataLayer.js";
import AuthDataLayer from "../db/services/authDataLayer.js";
import { asyncTryHandler } from "./apiController.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default class AuthController {
  private authDal: AuthDataLayer;
  private apiDal: ApiDataLayer;

  constructor(authDal: AuthDataLayer, apiDal: ApiDataLayer) {
    this.authDal = authDal;
    this.apiDal = apiDal;
  }
  public index = asyncTryHandler(async (req, res, next) => {
    return res.json({ isAuth: true, userId: req.user?.id });
  });
  public test = asyncTryHandler(async (req, res, next) => {
    return res.json({ passedAuthTest: true });
  });
  public login = asyncTryHandler(
    async (
      req: Request<{}, {}, { email: string; password: string }>,
      res,
      next
    ) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          errors: [{ message: "Email and password are required" }],
        });
      }
      //check if user exists
      const user = await this.authDal.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({
          errors: [{ message: "There is no account with this email" }],
        });
      }
      //check if password is correct
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          errors: [{ message: "Password is incorrect" }],
        });
      }
      //generate token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.log("JWT secret is not defined");
        return res.status(500).json({
          errors: [
            { message: "Internal server error - cannot authorize any users" },
          ],
        });
      }
      const token = jwt.sign(
        { id: user._id, email: user.email, isAdmin: user.isAdmin },
        jwtSecret,
        {
          expiresIn: "4h",
        }
      );

      const ENVIRONMENT = process.env?.NODE_ENV;
      if (ENVIRONMENT === "production") {
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
          // maxAge = how long the cookie is valid for in milliseconds
          maxAge: 3600000 * 4, // 4hrs,
        });
      } else {
        res.cookie("token", token, {
          httpOnly: true,
          // maxAge = how long the cookie is valid for in milliseconds
          maxAge: 3600000 * 4, // 4hrs,
        });
      }
      return res.json({ isSuccess: true });
    }
  );
  public logout = asyncTryHandler(async (req: Request, res, next) => {
    //delete token from cookies
    res.clearCookie("token");
    return res.sendStatus(200);
  });
}
