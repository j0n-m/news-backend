import { NextFunction, Response, Request } from "express";
import { SearchQuery } from "../types/searchParams.js";
import rssParser from "../utils/rssParser.js";
import z from "zod";
import ApiDataLayer from "../db/services/apiDataLayer.js";
import mongoose from "mongoose";
import { body, validationResult, ValidationError } from "express-validator";
import { IFeed } from "../models/Feed.js";
import { ICategory } from "../models/Category.js";
import { IUser } from "../models/User.js";
import bcrypt from "bcrypt";
import { ICommunityFeed } from "../models/CommunityFeed.js";
import {
  FeedItemSchema,
  ICommunityFeedItem,
} from "../models/CommunityFeedItem.js";

export type MiddlewareFunction = (
  req: Request | any,
  res: Response,
  next: NextFunction
) => Promise<any>;

export function asyncTryHandler(fn: MiddlewareFunction) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default class ApiController {
  private dal: ApiDataLayer;
  constructor(dataAccessLayer: ApiDataLayer) {
    this.dal = dataAccessLayer;
  }
  public home = asyncTryHandler(
    async (req: Request<{}, {}, {}, SearchQuery>, res, next) => {
      const homeLimitSchema = z.enum(["1", "5", "7"]).catch("5");
      const schemaRes = homeLimitSchema.parse(req.query.limit);

      const limit = Number(schemaRes);
      const CONTENT_LIMIT = 15;

      //query users feed urls
      const feedURLs = [
        // "https://moxie.foxnews.com/google-publisher/politics.xml",
        "https://www.theverge.com/rss/index.xml",
        "https://api.axios.com/feed/",
        "https://9to5mac.com/feed",
        "https://www.cbsnews.com/latest/rss/main",
        // "https://www.investing.com/rss/news.rss",
        "https://fortune.com/feed",
        "https://www.reddit.com/.rss",
      ];

      let startIndex: number | null = Number(req.query.startIndex) || 0;
      const endIndex = feedURLs.length - 1;

      if (isNaN(Number(startIndex)) || startIndex > endIndex) {
        return res.json({
          data: [],
          nextStart: null,
        });
      }

      //loops through feedURL array
      let totalFeedItems = 0;
      const feeds = [];
      for (let i = startIndex; i < feedURLs.length; i++) {
        if (totalFeedItems + limit > CONTENT_LIMIT) break;
        const feed = await rssParser(feedURLs[i], { limit });
        totalFeedItems += feed.items.length;
        feeds.push(feed);
        startIndex = i + 1 > endIndex ? null : i + 1;
      }
      return res.json({
        data: feeds,
        nextStart: startIndex,
      });
    }
  );
  public categories_get = asyncTryHandler(
    async (req: Request<{}, {}, {}, SearchQuery>, res, next) => {
      const categories = await this.dal.getCategories({ query: req.query });
      return res.json({ categories });
    }
  );
  public categories_post = [
    body("name", "Name must be at least 3 characters long.")
      .trim()
      .isLength({ min: 3 }),

    asyncTryHandler(async (req: Request<{}, {}, ICategory>, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors
            .array()
            .map((e: ValidationError & { value?: string }) => ({
              value: e?.value,
              message: e.msg,
            })),
        });
      }

      const category = await this.dal.createCategory(req.body);
      if (!category) {
        return res.status(400).json({
          errors: [
            { message: "Unable to create this category, try again later." },
          ],
        });
      }
      return res.json({ isSuccess: true, id: category._id.toString() });
    }),
  ];
  public category_detail_get = asyncTryHandler(
    async (
      req: Request<{ categoryId: string }, {}, {}, SearchQuery>,
      res,
      next
    ) => {
      const categoryId = req.params.categoryId;
      if (!mongoose.isValidObjectId(categoryId)) {
        return next(); //404
      }
      const category = await this.dal.getCategory({
        categoryId,
        query: req.query,
      });
      if (!category.length) {
        return next();
      }
      return res.json({ category: category });
    }
  );
  public category_put = [
    body("name", "Name must be at least 3 characters long.")
      .optional()
      .trim()
      .isLength({ min: 3 }),
    asyncTryHandler(async (req: Request<{ categoryId: string }>, res, next) => {
      const categoryId = req.params.categoryId;

      if (!mongoose.isValidObjectId(categoryId)) {
        return next();
      }

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors
            .array()
            .map((e: ValidationError & { value?: string }) => ({
              value: e?.value,
              message: e.msg,
            })),
        });
      }

      const newCategory = await this.dal.editCategory({
        ...req.body,
        categoryId,
      });
      if (!newCategory) {
        return res.status(400).json({
          errors: [
            {
              message: "Unable to edit this category, please try again later.",
            },
          ],
        });
      }
      return res.json({ isSuccess: true, id: newCategory.id });
    }),
  ];
  public category_delete = asyncTryHandler(
    async (req: Request<{ categoryId: string }>, res, next) => {
      const categoryId = req.params.categoryId;
      if (!mongoose.isValidObjectId(categoryId)) {
        return next();
      }
      const category = await this.dal.deleteCategory(categoryId);

      return res.json({ isSuccess: true, id: categoryId });
    }
  );
  public feeds_get = asyncTryHandler(
    async (req: Request<{}, {}, {}, SearchQuery>, res, next) => {
      const feeds = await this.dal.getFeeds({ query: req.query });
      return res.json({
        feeds,
      });
    }
  );

  public feeds_post = [
    body("category", "Categories is in an invalid format.")
      .isArray({ min: 1 })
      .bail()
      .custom((val: string[]) => {
        for (const id of val) {
          if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
            throw new Error("One or more category ids are invalid.");
          }
        }
        return true;
      })
      .bail()
      .customSanitizer((val: string[]) => {
        return val.map((v) => new mongoose.Types.ObjectId(v));
      })
      .bail(),
    body("url", "URL must be in the HTTPS url protocol format.")
      .trim()
      .isString()
      .isURL()
      .bail()
      .custom(async (val: string) => {
        const isValidURL = /https/i.test(val);
        if (!isValidURL) {
          throw new Error("URL must be in the HTTPS url protocol format.");
        }

        return true;
      })
      .bail(),
    body("title", "Title must be at least 3 characters long")
      .optional()
      .trim()
      .bail()
      .isLength({ min: 3 }),

    asyncTryHandler(async (req: Request<{}, {}, IFeed>, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors
            .array()
            .map((e: ValidationError & { value?: string }) => ({
              value: e?.value,
              message: e.msg,
            })),
        });
      }
      //check if url is compatabile
      const parsedURL = await rssParser(req.body?.url, { limit: 1, skip: 0 });
      if (!parsedURL) {
        return res.status(400).json({
          errors: [{ message: "Feed url is not compatabile, try another url" }],
        });
      }
      //if title is not provided, use the url as the title
      if (!req.body?.title || req.body?.title?.length < 3) {
        req.body.title = parsedURL?.feed_title || "myCustomFeed";
      }

      const feed = await this.dal.createFeed(req.body);
      if (!feed) {
        return res
          .status(400)
          .json({ errors: [{ message: "Unable to create this feed." }] });
      }
      return res.json({ isSuccess: true, id: feed.id });
    }),
  ];
  public feed_detail_get = asyncTryHandler(
    async (
      req: Request<{ feedId: string }, {}, {}, SearchQuery>,
      res,
      next
    ) => {
      const feedId = req.params.feedId;
      if (!mongoose.isValidObjectId(feedId)) {
        return next();
      }
      const feed = await this.dal.getFeed({ feedId, query: req.query });
      if (!feed.length) {
        return next();
      }
      return res.json({
        feed,
      });
    }
  );
  public feed_delete = asyncTryHandler(
    async (req: Request<{ feedId: string }>, res, next) => {
      const feedId = req.params.feedId;
      if (!mongoose.isValidObjectId(feedId)) {
        return next();
      }
      const feedRes = await this.dal.deleteFeed({ feedId });

      return res.json({ isSuccess: true, id: feedId });
    }
  );
  public feed_put = [
    body("title", "Title must be at least 3 characters long")
      .optional()
      .trim()
      .bail()
      .isLength({ min: 3 }),
    body("category", "Categories is in an invalid format.")
      .optional()
      .isArray({ min: 1 })
      .bail()
      .custom((val: string[]) => {
        for (const id of val) {
          if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
            throw new Error("One or more category ids are invalid.");
          }
        }
        return true;
      })
      .bail()
      .customSanitizer((val: string[]) => {
        return val.map((v) => new mongoose.Types.ObjectId(v));
      })
      .bail(),
    body("url", "URL must be in the HTTPS url protocol format.")
      .optional()
      .trim()
      .isString()
      .isURL()
      .bail()
      .custom(async (val: string) => {
        const isValidURL = /https/i.test(val);
        if (!isValidURL) {
          throw new Error("URL must be in the HTTPS url protocol format.");
        }

        const parsedURL = await rssParser(val, { limit: 1, skip: 0 });
        if (!parsedURL) {
          throw new Error("Feed url is not compatabile, try another url.");
        }
        return true;
      })
      .bail(),

    asyncTryHandler(
      async (req: Request<{ feedId: string }, {}, IFeed>, res, next) => {
        const feedId = req.params.feedId;
        if (!mongoose.isValidObjectId(feedId)) {
          return next();
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            errors: errors
              .array()
              .map((e: ValidationError & { value?: string }) => ({
                value: e?.value,
                message: e.msg,
              })),
          });
        }

        const response = await this.dal.editFeed({ feedId, feed: req.body });
        if (!response) {
          return res.status(400).json({
            errors: [{ message: "Unable to update this feed." }],
          });
        }
        return res.json({
          isSuccess: true,
          id: response.id,
        });
      }
    ),
  ];

  public users_post = [
    body("isAdmin", "isAdmin must be true or false").optional().isBoolean(),
    body("first_name", "First name must be at least 3 characters long")
      .trim()
      .isLength({ min: 2 }),
    body("last_name", "Last name must be at least 3 characters long")
      .trim()
      .isLength({ min: 2 }),
    body("email", "Email must be at least 5 characters long")
      .trim()
      .isLength({ min: 5 })
      .isEmail()
      .bail()
      .custom(async (v: string) => {
        const isDupeEmail = await this.dal.checkDupeEmail(v);
        if (isDupeEmail) {
          throw new Error("Email is already taken.");
        }
        return true;
      }),
    body("password", "Password must be at least 5 characters long")
      .trim()
      .isLength({ min: 5 }),
    body("date_joined").optional().isISO8601(),

    asyncTryHandler(async (req: Request<{}, {}, IUser>, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors
            .array()
            .map((e: ValidationError & { value?: string }) => ({
              value: e?.value,
              message: e.msg,
            })),
        });
      }
      if (!req?.user?.isAdmin) {
        req.body.isAdmin = false;
        req.body.date_joined = new Date();
      }
      //hash password
      req.body.password = await bcrypt.hash(req.body.password, 5);

      const createdUser = await this.dal.createUser({ data: req.body });

      if (!createdUser) {
        return res.status(400).json({
          errors: [{ message: "Unable to create user, try again later." }],
        });
      }
      return res.json({ isSuccess: true, id: createdUser.id });
    }),
  ];
  public users_get = asyncTryHandler(
    async (req: Request<{}, {}, {}, SearchQuery>, res, next) => {
      if (!req.query.sort) {
        req.query.sort = "-date_joined";
      }

      const users = await this.dal.getUsers({ query: req.query });

      return res.json({ users });
    }
  );
  public user_detail_get = asyncTryHandler(
    async (
      req: Request<{ userId: string }, {}, {}, SearchQuery>,
      res,
      next
    ) => {
      const userId = req.params.userId;
      if (!mongoose.isValidObjectId(userId)) {
        return next();
      }
      const user = await this.dal.getUser({ userId, query: req.query });
      if (!user.length) {
        return next();
      }
      return res.json({ user });
    }
  );
  public user_delete = asyncTryHandler(
    async (req: Request<{ userId: string }>, res, next) => {
      const userId = req.params.userId;
      if (!mongoose.isValidObjectId(userId)) {
        return next();
      }
      const deletedUser = await this.dal.deleteUser({ userId });

      return res.json({ isSuccess: true, id: userId });
    }
  );
  public user_feeds_get = asyncTryHandler(
    async (
      req: Request<{ userId: string }, {}, {}, SearchQuery>,
      res,
      next
    ) => {
      const userId = req.params.userId;
      if (!mongoose.isValidObjectId(userId)) {
        return next();
      }
      const userFeeds = await this.dal.getUserFeeds({
        userId,
        query: req.query,
      });
      return res.json({ user_feeds: userFeeds });
    }
  );
  public user_feed_items_get = asyncTryHandler(async (req, res, next) => {
    const userId = req.params.userId;
    if (!mongoose.isValidObjectId(userId)) {
      return next();
    }
    const userFeedItems = await this.dal.getUserFeedItems({
      userId,
      query: req.query,
    });
    return res.json({ saved_feed_items: userFeedItems });
  });

  public user_feeds_post = [
    body("url", "URL must be in a HTTPS format")
      .trim()
      .isString()
      .isURL()
      .bail()
      .custom(async (val: string) => {
        const isValidURL = /https/i.test(val);
        if (!isValidURL) {
          throw new Error("URL must be in the HTTPS url protocol format.");
        }

        const parsedURL = await rssParser(val, { limit: 1, skip: 0 });
        if (!parsedURL) {
          throw new Error("Feed url is not compatabile, try another url.");
        }
        return true;
      }),
    body("title", "Title must be at least 3 characters long")
      .trim()
      .isLength({ min: 3 }),
    body("is_pinned", "is_pinned must be true or false")
      .default(false)
      .isBoolean(),
    body("category", "Category must be a list of valid category ids")
      .isArray({ min: 1 })
      .bail()
      .custom(async (arr: string[]) => {
        for (const id of arr) {
          if (!(await this.dal.isValidCategory(id))) {
            return new Error(`The category id, '${id}', is invalid`);
          }
        }
        return true;
      })
      .customSanitizer((arr: string[]) => {
        return arr.map((id: string) => new mongoose.Types.ObjectId(id));
      }),
    body("owner", "Owner must be a valid user id")
      .trim()
      .isMongoId()
      .bail()
      .custom(async (id: string) => {
        return await this.dal.isValidUser(id);
      })
      .bail()
      .customSanitizer((id: string) => {
        return new mongoose.Types.ObjectId(id);
      }),
    asyncTryHandler(
      async (
        req: Request<{ userId: string }, {}, ICommunityFeed>,
        res,
        next
      ) => {
        const userId = req.params.userId;
        if (!mongoose.isValidObjectId(userId)) {
          return next();
        }
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return res.status(400).json({
            errors: errors
              .array()
              .map((e: ValidationError & { value?: string }) => ({
                value: e?.value,
                message: e.msg,
              })),
          });
        }
        const isDupeFeedURL = await this.dal.isDupeFeedURL(
          userId,
          req.body.url
        );
        if (isDupeFeedURL) {
          return res.status(400).json({
            errors: [{ message: "You already have a feed with this url" }],
          });
        }

        const addFeed = await this.dal.createUserFeed({
          userId,
          data: req.body,
        });
        return res.json({ isSuccess: true, id: addFeed.id });
      }
    ),
  ];

  public user_feed_items_post = [
    body("feed_title", "feed title must be at least 3 characters long")
      .trim()
      .isLength({ min: 3 }),
    body("data_added", "date added must be in a ISO8601 date format")
      .default(new Date())
      .bail()
      .isISO8601(),
    body("owner", "owner must be a valid user id")
      .isMongoId()
      .bail()
      .custom(async (id: string) => {
        if (!(await this.dal.isValidUser(id))) {
          throw new Error("owner id is not a valid user id");
        }
        return true;
      })
      .customSanitizer((id: string) => {
        return new mongoose.Types.ObjectId(id);
      }),
    body("data", "Data must be in an object format")
      .isObject()
      .bail()
      .custom((data) => {
        const res = FeedItemSchema.safeParse(data);
        if (!res.success) {
          throw res.error.issues.map((e) => e?.message);
        }
        return true;
      }),
    asyncTryHandler(
      async (
        req: Request<{ userId: string }, {}, ICommunityFeedItem>,
        res,
        next
      ) => {
        const userId = req.params.userId;

        if (!mongoose.isValidObjectId(userId)) {
          return next();
        }

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return res.status(400).json({
            errors: errors
              .array()
              .map((e: ValidationError & { value?: string }) => ({
                value: e?.value,
                message: e.msg,
              })),
          });
        }

        if (!req?.user?.isAdmin) {
          req.body.date_added = new Date();
        }
        const addFeedItem = await this.dal.createUserFeedItem({
          data: req.body,
        });
        return res.json({ isSuccess: true, id: addFeedItem.id });
      }
    ),
  ];
  public user_feed_detail_get = asyncTryHandler(
    async (
      req: Request<{ userId: string; feedId: string }, {}, {}, SearchQuery>,
      res,
      next
    ) => {
      const userId = req.params.userId;
      const feedId = req.params.feedId;
      let rssData;

      if (
        !mongoose.isValidObjectId(userId) ||
        !mongoose.isValidObjectId(feedId)
      ) {
        return next();
      }
      const userFeed = await this.dal.getUserFeed({
        userId,
        feedId,
        query: req.query,
      });
      if (!userFeed.length) {
        return next();
      }
      if (req.query.show === "true") {
        try {
          const rss = await rssParser(userFeed[0].url, { limit: 20, skip: 0 });
          rssData = rss;
        } catch (error) {
          return res.status(500).json({
            errors: [{ message: "Error parsing feed data from user's feed" }],
          });
        }
      }
      return res.json({
        user_feed: userFeed,
        rss_data: rssData ? rssData : [],
      });
    }
  );
  public user_feed_item_detail_get = asyncTryHandler(
    async (
      req: Request<{ userId: string; feedItemId: string }, {}, {}, SearchQuery>,
      res,
      next
    ) => {
      const userId = req.params.userId;
      const feedItemId = req.params.feedItemId;
      if (
        !mongoose.isValidObjectId(userId) ||
        !mongoose.isValidObjectId(feedItemId)
      ) {
        return next();
      }
      const userFeedItem = await this.dal.getUserFeedItem({
        userId,
        feedItemId,
        query: req.query,
      });
      if (!userFeedItem.length) {
        return next();
      }

      return res.json({
        user_feed_item: userFeedItem,
      });
    }
  );
  public user_feed_delete = asyncTryHandler(
    async (req: Request<{ userId: string; feedId: string }>, res, next) => {
      const userId = req.params.userId;
      const feedId = req.params.feedId;

      if (
        !mongoose.isValidObjectId(userId) ||
        !mongoose.isValidObjectId(feedId)
      ) {
        return next();
      }
      const deletedFeed = await this.dal.deleteUserFeed(feedId);
      return res.json({
        isSuccess: true,
        id: feedId,
      });
    }
  );
  public user_feed_item_delete = asyncTryHandler(
    async (req: Request<{ userId: string; feedItemId: string }>, res, next) => {
      const userId = req.params.userId;
      const feedItemId = req.params.feedItemId;

      if (
        !mongoose.isValidObjectId(userId) ||
        !mongoose.isValidObjectId(feedItemId)
      ) {
        return next();
      }

      const deletedFeedItem = await this.dal.deleteUserFeedItem(feedItemId);
      return res.json({
        isSuccess: true,
        id: feedItemId,
      });
    }
  );
}

// const example_fox = asyncTryHandler(
//   async (req: Request<{}, {}, {}, SearchParams>, res, next) => {
//     const limit = Number(req.query.limit) || 10;
//     let skip = Number(req.query.skip) || 0;

//     const feedURL: string =
//       "https://moxie.foxnews.com/google-publisher/politics.xml";
//     const feed = await rssParser(feedURL, { skip, limit });

//     return res.json({
//       data: [
//         {
//           feed_title: feed.feed_title,
//           feed_link: feed.feed_link,
//           feed_description: feed.feed_description,
//           items: feed.items,
//         },
//       ],
//       nextStart: {
//         skip: skip + limit,
//         limit: limit,
//       },
//     });
//   }
// );
