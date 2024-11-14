import express, { NextFunction } from "express";
import { ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import apiRoutes from "./src/routes/api.js";
import authRoutes from "./src/routes/auth.js";

dotenv.config();
const app = express();
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
    reason: err,
  });
} as ErrorRequestHandler);

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is listening on port: ${process.env.SERVER_PORT}`);
});
