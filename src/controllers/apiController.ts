import { NextFunction, Response, Request } from "express";
import Parser from "rss-parser";
import { SearchParams } from "../types/searchParams.js";
import rssParser from "../utils/rssParser.js";
import z from "zod";

type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

function asyncTryHandler(fn: MiddlewareFunction) {
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

const home = asyncTryHandler(
  async (req: Request<{}, {}, {}, SearchParams>, res, next) => {
    const homeLimitSchema = z.enum(["1", "5", "7"]).catch("5");
    const schemaRes = homeLimitSchema.parse(req.query.limit);

    const limit = Number(schemaRes);
    const CONTENT_LIMIT = 15;

    //query users feed urls
    const feedURLs = [
      // "https://moxie.foxnews.com/google-publisher/politics.xml",
      // "https://www.theverge.com/rss/index.xml",
      // "https://api.axios.com/feed/",
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

const example_fox = asyncTryHandler(
  async (req: Request<{}, {}, {}, SearchParams>, res, next) => {
    const limit = Number(req.query.limit) || 10;
    let skip = Number(req.query.skip) || 0;

    const feedURL: string =
      "https://moxie.foxnews.com/google-publisher/politics.xml";
    const feed = await rssParser(feedURL, { skip, limit });

    return res.json({
      data: [
        {
          feed_title: feed.feed_title,
          feed_link: feed.feed_link,
          feed_description: feed.feed_description,
          items: feed.items,
        },
      ],
      nextStart: {
        skip: skip + limit,
        limit: limit,
      },
    });
  }
);

export { home, example_fox };
