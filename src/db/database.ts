import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";
dotenv.config();
//controller
async function connect() {
  try {
    await mongoose.connect(process.env.DB_CONNECTION || "");
  } catch (error) {
    console.log(error);
  }
}

export default connect;
