import mongoose, { Types } from "mongoose";

const Schema = mongoose.Schema;

export interface IFeed {
  url: string;
  title: string;
  category: Array<Types.ObjectId>;
  is_global: boolean;
}

const feedSchema = new Schema<IFeed>({
  url: {
    type: String,
    validate: {
      validator: (url: string) => {
        return /https:\/\//i.test(url);
      },
      message: (v) =>
        `error: ${v} is not a valid feed url. Must contain 'https://'`,
    },
    required: true,
  },
  title: {
    type: String,
    minlength: 3,
    required: true,
  },
  category: {
    type: [Schema.Types.ObjectId],
    ref: "Category",
    required: true,
  },
  is_global: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export default mongoose.model("Feed", feedSchema);
