import mongoose from "mongoose";
import { z } from "zod";

const Schema = mongoose.Schema;
export interface ICommunityFeedItem {
  data: FeedItem;
  feed: mongoose.Types.ObjectId;
  fallback_feed_title: string;
  date_added: Date;
  owner: mongoose.Types.ObjectId;
}

export const FeedItemSchema = z.object({
  content: z.string().optional(),
  image_url: z.string().optional(),
  url_id: z.string().uuid(),
  title: z
    .string({ message: "title must be at least 3 characters long" })
    .min(3),
  content_snippet: z.string({ message: "content_snippet is required" }),
  pubDate: z.coerce.date({ message: "pubDate must be a valid date" }),
  id: z.number({ message: "id must be a number >= 0" }).min(0),
  source_link: z.string({ message: "source_link is required" }),
  author: z.string().optional(),
});
export type FeedItem = z.infer<typeof FeedItemSchema>;

const communityFeedItemSchema = new Schema<ICommunityFeedItem>({
  feed: {
    type: mongoose.Schema.ObjectId,
    ref: "CommunityFeed",
  },
  fallback_feed_title: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  date_added: {
    type: "Date",
    required: true,
  },
  data: {
    title: {
      type: "String",
      required: true,
    },
    id: {
      type: "Number",
      required: true,
    },
    url_id: {
      type: "String",
      required: true,
    },
    pubDate: {
      type: "Date",
      required: true,
    },
    content_snippet: {
      type: "String",
      required: true,
    },
    source_link: {
      type: "String",
      required: true,
    },
    content: {
      type: "String",
      default: "",
    },
    image_url: {
      type: "String",
      default: "",
    },
    author: {
      type: "String",
      default: "",
    },
  },
});

export default mongoose.model("CommunityFeedItem", communityFeedItemSchema);
