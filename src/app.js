import express from "express";
import cors from "cors";

import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("src/uploads"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Team Task Manager API Running..."
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;