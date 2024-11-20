import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IUser {
  isAdmin: boolean;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  // feeds: Array<mongoose.Types.ObjectId>;
  // saved_feed_items: Array<mongoose.Types.ObjectId>;
  date_joined: Date;
}

const userSchema = new Schema<IUser>({
  isAdmin: {
    type: "Boolean",
    default: false,
  },
  first_name: {
    type: "String",
    required: true,
    minlength: 2,
    lowercase: true,
    get: (v: string) => `${v[0].toUpperCase() + v.slice(1)}`,
  },
  last_name: {
    type: "String",
    required: true,
    minlength: 2,
    lowercase: true,
    get: (v: string) => `${v[0].toUpperCase() + v.slice(1)}`,
  },
  email: {
    type: "String",
    required: true,
    lowercase: true,
  },
  password: {
    type: "String",
    required: true,
    minlength: 5,
  },
  // feeds: {
  //   type: [mongoose.Schema.ObjectId],
  //   ref: "CommunityFeed",
  //   default: [],
  // },
  // saved_feed_items: {
  //   type: [mongoose.Schema.ObjectId],
  //   ref: "CommunityFeedItem",
  //   default: [],
  // },
  date_joined: {
    type: Date,
    required: true,
  },
});

export default mongoose.model("User", userSchema);
