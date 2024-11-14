import { Router } from "express";

const router = Router();

router.get("/test", (req, res, next) => {
  res.json({ test: "ok" });
});

export default router;
