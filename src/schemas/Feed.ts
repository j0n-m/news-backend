import { z } from "zod";

export const FeedItemSchema = z.object({
  content: z.string().optional(),
  image_url: z.string().optional(),
  title: z.string(),
  content_snippet: z.string(),
  pubDate: z.coerce.date(),
  id: z.number(),
  url_id: z.string(),
  source_link: z.string(),
  author: z.string().optional(),
});

export const FeedSchema = z.object({
  feed_title: z.string(),
  feed_link: z.string(),
  feed_description: z.string().optional(),
  items: z.array(FeedItemSchema),
  total_items: z.number(),
  id: z.string(),
});
export type ParsedFeed = z.infer<typeof FeedSchema>;
export type ParsedFeedItems = z.infer<typeof FeedItemSchema>;
