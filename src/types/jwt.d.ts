import { JwtPayload } from "jsonwebtoken";

export interface UserJwtPayload extends JwtPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}
