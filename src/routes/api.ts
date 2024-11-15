import { Request, Response, NextFunction, Router } from "express";
import * as apiController from "../controllers/apiController.js";

const router = Router();

router.get("/test", (req, res, next) => {
  res.json({ test: "ok" });
});
// router.get("/home", (req: Request, res: Response, next: NextFunction): any => {
//   return res.sendStatus(200);
// });
router.get("/home", apiController.home);
router.get("/fox", apiController.example_fox);

export default router;
