import { Router } from "express";
import ApiController from "../controllers/apiController.js";

const apiRouter = (apiController: ApiController) => {
  const router = Router();

  router.get("/test", (req, res, next) => {
    res.json({ test: "ok" });
  });

  router.get("/home", apiController.home);

  //get list of feed categories
  router.get("/categories", apiController.categories_get); //anyone
  router.post("/categories", apiController.categories_post); //admin

  router.get("/category/:categoryId", apiController.category_detail_get); //anyone
  router.delete("/category/:categoryId", apiController.category_delete); //admin
  router.put("/category/:categoryId", apiController.category_put); //admin

  //get list of global feeds
  router.get("/feeds", apiController.feeds_get); //anyone
  router.post("/feeds", apiController.feeds_post); //admin for global feeds otherwise available to authed users

  //get single global feed info
  router.get("/feed/:feedId", apiController.feed_detail_get); //anyone
  router.put("/feed/:feedId", apiController.feed_put); //admin
  router.delete("/feed/:feedId", apiController.feed_delete); //admin

  //get users list
  router.get("/users", apiController.users_get); //admin
  router.post("/users", apiController.users_post); //anyone

  router.get("/user/:userId", apiController.user_detail_get); //admin or self user
  router.delete("/user/:userId", apiController.user_delete); //admin or self user

  ////////

  //get user's feeds
  router.get("/user/:userId/feeds", apiController.user_feeds_get); //admin or self user
  router.get(
    "/user/:userId/saved-feed-items",
    apiController.user_feed_items_get
  ); //admin or self user

  //post to user's feed
  router.post("/user/:userId/feeds", apiController.user_feeds_post); //admin or self user
  router.post(
    "/user/:userId/saved-feed-items",
    apiController.user_feed_items_post
  ); //admin or self user

  //view single user's feed
  router.get("/user/:userId/feed/:feedId", apiController.user_feed_detail_get); //admin or self user
  router.get(
    "/user/:userId/saved-feed-item/:feedItemId",
    apiController.user_feed_item_detail_get
  ); //admin or self user

  //delete from user's feed
  router.delete("/user/:userId/feed/:feedId", apiController.user_feed_delete); //admin or self user
  router.delete(
    "/user/:userId/saved-feed-item/:feedItemId",
    apiController.user_feed_item_delete
  ); //admin or self user

  // router.get("/fox", apiController.example_fox);

  return router;
};

export default apiRouter;
