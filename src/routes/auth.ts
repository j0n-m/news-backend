import { Router } from "express";

const router = Router();

router.post("/signin", (req, res, next) => {
  res.sendStatus(200);
});
router.post("/signout", (req, res, next) => {
  res.sendStatus(200);
});

export default router;
