import { NextFunction, Response, Request } from "express";
import { SearchQuery } from "../types/searchParams.js";
import rssParser from "../utils/rssParser.js";
import z from "zod";
import ApiDataLayer from "../db/services/apiDataLayer.js";
import mongoose from "mongoose";
import { body, validationResult, ValidationError } from "express-validator";

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
        "https://moxie.foxnews.com/google-publisher/politics.xml",
        "https://www.theverge.com/rss/index.xml",
        "https://api.axios.com/feed/",
        // "https://9to5mac.com/feed",
        // "https://www.cbsnews.com/latest/rss/main",
        // "https://www.investing.com/rss/news.rss",
        // "https://fortune.com/feed",
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

    asyncTryHandler(
      async (req: Request<{}, {}, { name: string }>, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return res.json({
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
      }
    ),
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
      if (!category) {
        return res
          .status(400)
          .json({ errors: [{ message: "Unable to delete this category." }] });
      }
      return res.sendStatus(200);
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
