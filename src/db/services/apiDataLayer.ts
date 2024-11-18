import mongoose from "mongoose";
import Category from "../../models/Category.js";
import Feed from "../../models/Feed.js";
import AggregateApi from "./AggregateApi.js";
import { SearchQuery } from "../../types/searchParams.js";

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
    categoriesAggregate.sort();
    categoriesAggregate.project();
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

    feedsAggregate.sort();
    feedsAggregate.project();

    const feeds = await feedsAggregate.aggregation;
    return feeds;
  }
}
