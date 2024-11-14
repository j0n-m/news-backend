import express from "express";
import dotenv from "dotenv";
import apiRoutes from "./src/routes/api.js";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/api", apiRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    code: 404,
    message: "Page not found",
  });
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is listening on port: ${process.env.SERVER_PORT}`);
});
