import "reflect-metadata";
import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import { AppDataSource } from "./config/database";

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Relay API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
