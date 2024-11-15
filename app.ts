import express, { NextFunction } from "express";
import { ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import apiRoutes from "./src/routes/api.js";
import authRoutes from "./src/routes/auth.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
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
app.use(express.json());

app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    code: 404,
    message: "Page not found",
  });
});

app.use(function (err: unknown, req, res, next) {
  res.status(500).json({
    code: 500,
    message: "An unexpected server error occured.",
    reason: err ? err : "unknown",
  });
} as ErrorRequestHandler);

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is listening on port: ${process.env.SERVER_PORT}`);
});
