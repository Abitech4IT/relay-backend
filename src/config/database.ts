import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { env } from "./env";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",

  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,

  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,

  database: env.DATABASE_NAME,

  entities: ["src/modules/**/*.entity.ts"],
  // entities: [User, RefreshToken],

  migrations: ["src/database/migrations/*.ts"],

  synchronize: false,

  logging: false,
});
