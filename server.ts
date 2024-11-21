import dotenv from "dotenv";
import appExpress from "./app.js";
import connect from "./src/db/database.js";
import ApiDataLayer from "./src/db/services/apiDataLayer.js";
import ApiController from "./src/controllers/apiController.js";
import AuthDataLayer from "./src/db/services/authDataLayer.js";
import AuthController from "./src/controllers/authController.js";
dotenv.config();

const apiDAL = new ApiDataLayer();
const authDAL = new AuthDataLayer();
const apiController = new ApiController(apiDAL);
const authController = new AuthController(authDAL, apiDAL);

appExpress(apiController, authController).listen(
  process.env.SERVER_PORT,
  async () => {
    await connect();
    console.log(`Server is listening on port: ${process.env.SERVER_PORT}`);
  }
);
