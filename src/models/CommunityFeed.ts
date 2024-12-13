import mongoose from "mongoose";

export interface ICommunityFeed {
  url: string;
  title: string;
  category: mongoose.Types.ObjectId[];
  is_pinned: boolean;
  owner: mongoose.Types.ObjectId;
}
export interface ICF extends ICommunityFeed {
  _id: string;
}

const Schema = mongoose.Schema;

const communityFeedSchema = new Schema<ICommunityFeed>({
  url: {
    type: String,
    validate: {
      validator: (url: string) => {
        return /https:\/\//i.test(url);
      },
      message: () =>
        `error: url is not a valid feed url. Must contain 'https://'`,
    },
    required: true,
  },
  title: {
    type: "String",
    minlength: 3,
    required: true,
  },
  is_pinned: {
    type: "Boolean",
    default: false,
  },
  category: {
    type: [Schema.Types.ObjectId],
    ref: "Category",
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export default mongoose.model("CommunityFeed", communityFeedSchema);
