import { IRouterMatcher, Router } from "express";
import AuthController from "../controllers/authController.js";
import { verifyAuth } from "../middleware/verifyAuth.js";

const authRouter = (authController: AuthController) => {
  const router = Router();
  router.get("/test", authController.test);
  router.get("/test-auth", verifyAuth, authController.test);
  router.post("/login", authController.login);
  router.post("/logout", authController.logout);

  return router;
};
export default authRouter;
