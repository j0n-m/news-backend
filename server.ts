import express, { NextFunction } from "express";
import dotenv from "dotenv";
import appExpress from "./app.js";
import connect from "./src/db/database.js";
import ApiDataLayer from "./src/db/services/apiDataLayer.js";
import ApiController from "./src/controllers/apiController.js";
dotenv.config();
const apiDAL = new ApiDataLayer();
const apiController = new ApiController(apiDAL);

appExpress(apiController).listen(process.env.SERVER_PORT, async () => {
  await connect();
  console.log(`Server is listening on port: ${process.env.SERVER_PORT}`);
});
