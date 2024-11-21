import { JwtPayload } from "jsonwebtoken";
import { UserJwtPayload } from "../jwt.js";

declare global {
  namespace Express {
    export interface Request {
      user?: UserJwtPayload;
      // user?: JwtPayload;
    }
  }
}

export {};
