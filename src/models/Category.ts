import mongoose from "mongoose";

export interface ICategory {
  name: string;
}

const Schema = mongoose.Schema;

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    minlength: 3,
    required: true,
  },
});

export default mongoose.model("Category", categorySchema);
