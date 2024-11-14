import { Router } from "express";

const router = Router();

router.get("/test", (req, res, next) => {
  res.json({ test: "ok" });
});
router.get("/home", (req, res, next) => {
  res.json({ home: "home" });
});

export default router;
