import express from "express";
import { ErrorRequestHandler } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import ApiDataLayer from "./src/db/services/apiDataLayer.js";
import ApiController from "./src/controllers/apiController.js";
import apiRouter from "./src/routes/api.js";
import AuthController from "./src/controllers/authController.js";
import authRouter from "./src/routes/auth.js";

const appExpress = (
  apiController: ApiController,
  authController: AuthController
) => {
  const app = express();

  const corsOptions: cors.CorsOptions = {
    // origin: "http://localhost:5173",
    origin: function (origin, callback) {
      //true makes sure the if statement always runs
      //this allows ALL domains to access
      if (true || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    allowedHeaders: ["Content-Type"],
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(morgan("tiny"));
  app.use(cookieParser());
  app.use(express.json({ limit: "5mb" }));

  app.use("/api", apiRouter(apiController));
  app.use("/auth", authRouter(authController));
  // app.use("/auth", authRoutes);

  app.use((req, res, next) => {
    res.status(404).json({
      code: 404,
      message: "Page not found",
    });
  });

  app.use(function (err: unknown, req, res, next) {
    console.log(err);
    res.status(500).json({
      code: 500,
      message: "An unexpected server error occured.",
      reason: err ? err : "unknown",
    });
  } as ErrorRequestHandler);

  return app;
};
export default appExpress;
