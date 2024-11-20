import mongoose, { Types } from "mongoose";

const Schema = mongoose.Schema;

export interface IFeed {
  url: string;
  title: string;
  category: Array<Types.ObjectId>;
}

//USED FOR GLOBAL LIST MANAGED BY ADMINS
const feedSchema = new Schema<IFeed>({
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
    type: String,
    minlength: 3,
    required: true,
  },
  category: {
    type: [Schema.Types.ObjectId],
    ref: "Category",
    required: true,
  },
});

export default mongoose.model("Feed", feedSchema);
