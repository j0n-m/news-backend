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

//get list of feed categories
router.get("/categories"); //anyone
router.post("/categories"); //admin

router.get("/category/:categoryId"); //anyone
router.delete("/category/:categoryId"); //admin
router.put("/category/:categoryId"); //admin

//get list of global feeds
router.get("/feeds"); //anyone
router.post("/feeds"); //admin

//get single global feed info
router.get("/feed/:feedId"); //anyone
router.put("/feed/:feedId"); //admin
router.delete("/feed/:feedId"); //admin

//get users list
router.get("/users"); //admin
router.post("/users"); //anyone

router.get("/user:userId"); //admin or self user
router.delete("/user/:userId"); //admin or self user

//get user's feeds
router.get("/user/:userId/feeds"); //admin or self user
router.get("/user/:userId/feeds/saved"); //admin or self user

///////

//post to user's feed
router.post("/user/:userId/feeds"); //admin or self user
router.post("/user/:userId/feeds/saved"); //admin or self user

//view single user's feed
router.get("/user/:userId/feed/:feedId"); //admin or self user
router.get("/user/:userId/feed/saved/:feedItemId"); //admin or self user

//delete from user's feed
router.delete("/user/:userId/feed/:feedId"); //admin or self user
router.delete("/user/:userId/feed/saved/:feedItemId"); //admin or self user

// router.get("/fox", apiController.example_fox);

export default router;
