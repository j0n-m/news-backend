import mongoose from "mongoose";
import Category from "../../models/Category.js";
import Feed, { IFeed } from "../../models/Feed.js";
import AggregateApi from "./AggregateApi.js";
import { SearchQuery } from "../../types/searchParams.js";
import User, { IUser } from "../../models/User.js";
import CommunityFeed, { ICommunityFeed } from "../../models/CommunityFeed.js";
import CommunityFeedItem, {
  ICommunityFeedItem,
} from "../../models/CommunityFeedItem.js";
import rssParser from "../../utils/rssParser.js";

export default class ApiDataLayer {
  public async createCategory({ name }: { name: string }) {
    const category = new Category({
      name,
    });
    const res = await category.save();
    return res.toJSON();
  }
  public async getCategories({ query }: { query: SearchQuery }) {
    const categoriesAggregate = new AggregateApi(
      Category.aggregate([
        {
          $match: {},
        },
      ]),
      query
    );
    categoriesAggregate.sort().project();
    const categories = await categoriesAggregate.aggregation;
    return categories;
  }
  public async getCategory({
    categoryId,
    query,
  }: {
    categoryId: string;
    query: SearchQuery;
  }) {
    // const category = await Category.findById(categoryId);
    // return category;
    const categoryAggregate = new AggregateApi(
      Category.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(categoryId),
          },
        },
      ]),
      query
    );
    categoryAggregate.project();
    const category = await categoryAggregate.aggregation;

    return category;
  }
  public async editCategory({
    categoryId,
    name,
  }: {
    categoryId: string;
    name?: string;
  }) {
    const oldCategory = await Category.findById(categoryId);

    if (!oldCategory) {
      return false;
    }
    const newCategory = await Category.findByIdAndUpdate(categoryId, {
      _id: oldCategory._id,
      name: name || oldCategory.name,
    });

    return newCategory;
  }
  public async deleteCategory(categoryId: string) {
    const response = await Category.findByIdAndDelete(categoryId);
    return response;
  }
  public async getFeeds({ query }: { query: SearchQuery }) {
    const feedsAggregate = new AggregateApi(
      Feed.aggregate([
        {
          $match: {},
        },
      ]),
      query
    );

    const clonedPipeline = Feed.aggregate(
      feedsAggregate.aggregation.pipeline()
    );
    const clonedAggregation = new AggregateApi(clonedPipeline, query);

    feedsAggregate.sort("title");
    feedsAggregate.project();

    //limits the return data size
    feedsAggregate.setSkip();
    feedsAggregate.setLimit();

    const feeds = await feedsAggregate.aggregation;

    //infinite pagination
    clonedAggregation.getInfinitePagination(feeds);

    const documentInfo = await clonedAggregation.aggregation;
    return { feeds, documentInfo };
  }
  public async createFeed(feedData: IFeed) {
    const feed = new Feed({
      url: feedData.url,
      title: feedData.title,
      category: feedData.category,
    });
    const res = await feed.save();
    return res;
  }
  public async getFeed({
    feedId,
    query,
  }: {
    feedId: string;
    query: SearchQuery;
  }) {
    const feedAggregate = new AggregateApi(
      Feed.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(feedId) } },
      ]),
      query
    );
    const feed = await feedAggregate.aggregation;
    return feed;
  }
  public async deleteFeed({ feedId }: { feedId: string }) {
    const feed = await Feed.findByIdAndDelete(feedId);
    return feed;
  }
  public async editFeed({ feedId, feed }: { feedId: string; feed: IFeed }) {
    const oldFeed = await Feed.findById(feedId);
    if (!oldFeed) {
      return null;
    }
    const newFeed = await Feed.findByIdAndUpdate(oldFeed.id, {
      _id: oldFeed._id,
      url: feed.url || oldFeed.url,
      title: feed.title || oldFeed.title,
      category: feed.category || oldFeed.category,
    });
    return newFeed;
  }
  public async createUser({ data }: { data: IUser }) {
    const newUser = new User({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
      isAdmin: data.isAdmin,
      date_joined: data.date_joined,
    });
    const user = await newUser.save();
    return user;
  }
  public async getUsers({ query }: { query: SearchQuery }) {
    const userAggregate = new AggregateApi(
      User.aggregate([{ $match: {} }]),
      query
    );

    userAggregate.sort();
    userAggregate.project();

    const users = await userAggregate.aggregation;
    return users;
  }
  public async checkDupeEmail(email: string) {
    const result = await User.findOne({ email });

    if (result) {
      //is duplicate
      return true;
    }
    return false;
  }
  public async isValidCategory(categoryId: string) {
    const category = await User.findById(categoryId);
    if (!category) {
      return false;
    }
    return true;
  }
  public async isValidUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    return true;
  }
  public async getUser({
    userId,
    query,
  }: {
    userId: string;
    query: SearchQuery;
  }) {
    const userAggregate = new AggregateApi(
      User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      ]),
      query
    );
    const user = await userAggregate.aggregation;

    return user;
  }
  public async deleteUser({ userId }: { userId: string }) {
    const deletedUser = await User.findByIdAndDelete(userId);
    return deletedUser;
  }
  public async getUserFeeds({
    userId,
    query,
  }: {
    userId: string;
    query: SearchQuery;
  }) {
    const userFeedsAggregate = new AggregateApi(
      CommunityFeed.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
          },
        },
      ]),
      query
    );
    userFeedsAggregate.sort("title").project();
    const userFeeds = await userFeedsAggregate.aggregation;
    return userFeeds;
  }
  public async getUserFeedItems({
    userId,
    query,
  }: {
    userId: string;
    query: SearchQuery;
  }) {
    const userFeedItemsAggregate = new AggregateApi(
      CommunityFeedItem.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
          },
        },
      ]),
      query
    );
    if (query?.url_id) {
      userFeedItemsAggregate.aggregation.append({
        $match: {
          "data.url_id": query.url_id,
        },
      });
    }
    if (query?.src_link) {
      userFeedItemsAggregate.aggregation.append({
        $match: {
          "data.source_link": query.src_link,
        },
      });
    }
    const clonedPipeline = Object.create(userFeedItemsAggregate.aggregation);
    const clonedAggregation = new AggregateApi(clonedPipeline, {});

    userFeedItemsAggregate.sort();
    userFeedItemsAggregate.project();

    userFeedItemsAggregate.setSkip();
    userFeedItemsAggregate.setLimit();

    const userFeedItems = await userFeedItemsAggregate.aggregation;

    //infinite pagination
    clonedAggregation.getInfinitePagination(userFeedItems);

    const documentInfo = await clonedAggregation.aggregation;

    return { userFeedItems, documentInfo };
  }
  public async createUserFeed({
    userId,
    data,
  }: {
    userId: string;
    data: ICommunityFeed;
  }) {
    const userFeed = new CommunityFeed({
      url: data.url,
      is_pinned: data.is_pinned,
      title: data.title,
      owner: data.owner,
      category: data.category,
    });
    const res = await userFeed.save();
    return res;
  }
  public async createUserFeedItem({ data }: { data: ICommunityFeedItem }) {
    const userFeedItem = new CommunityFeedItem({
      owner: data.owner,
      feed: data.feed,
      date_added: data.date_added,
      data: data.data,
    });
    const res = await userFeedItem.save();
    return res;
  }
  public async getUserFeed({
    userId,
    query,
    feedId,
  }: {
    userId: string;
    feedId: string;
    query: SearchQuery;
  }) {
    const userFeedAggregate = new AggregateApi(
      CommunityFeed.aggregate([
        {
          $match: {
            $and: [
              { owner: new mongoose.Types.ObjectId(userId) },
              { _id: new mongoose.Types.ObjectId(feedId) },
            ],
          },
        },
      ]),
      query
    );

    userFeedAggregate.sort();
    const userFeed = await userFeedAggregate.aggregation;
    return userFeed;
  }
  public async getUserFeedItem({
    userId,
    query,
    feedItemId,
  }: {
    userId: string;
    feedItemId: string;
    query: SearchQuery;
  }) {
    const userFeedItemAggregate = new AggregateApi(
      CommunityFeedItem.aggregate([
        {
          $match: {
            $and: [
              { owner: new mongoose.Types.ObjectId(userId) },
              { _id: new mongoose.Types.ObjectId(feedItemId) },
            ],
          },
        },
      ]),
      query
    );

    userFeedItemAggregate.sort().project();
    const userFeedItem = await userFeedItemAggregate.aggregation;
    return userFeedItem;
  }
  public async isGlobalDupeFeedURL(url: string) {
    const parsedURL = url.replace(/\/$/, "");

    const isDupe = await Feed.findOne({ url: parsedURL });
    if (!isDupe) {
      return false;
    }
    return true;
  }
  public async isDupeFeedItem({
    userId,
    source_link,
  }: {
    userId: string;
    source_link: string;
  }) {
    const isDupe = await CommunityFeedItem.findOne({
      owner: new mongoose.Types.ObjectId(userId),
      "data.source_link": source_link,
    });
    if (isDupe) {
      return true;
    }
    return false;
  }
  public async isDupeFeedURL(userId: string, url: string) {
    const parsedURL = url.replace(/\/$/, "");

    // const dupeRegex = new RegExp(`^${url}$`, "i");
    const isDupe = await CommunityFeed.findOne({
      owner: new mongoose.Types.ObjectId(userId),
      url: parsedURL,
    });

    if (!isDupe) {
      return false;
    }
    return true;
  }
  public async deleteUserFeed(feedId: string) {
    const deleteUserFeed = await CommunityFeed.findByIdAndDelete(feedId);
    return deleteUserFeed;
  }
  public async deleteUserFeedItem(feedItemId: string) {
    const deleteUserFeedItem = await CommunityFeedItem.findByIdAndDelete(
      feedItemId
    );
    return deleteUserFeedItem;
  }
}
