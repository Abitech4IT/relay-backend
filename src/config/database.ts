import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { env } from "./env";
import path from "path";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",

  host: env.DATABASE_HOST,

  port: Number(env.DATABASE_PORT),

  username: env.DATABASE_USER,

  password: env.DATABASE_PASSWORD,

  database: env.DATABASE_NAME,

  entities: [path.join(__dirname, "../modules/**/*.entity.{ts,js}")],

  migrations: [path.join(__dirname, "../database/migrations/*.{ts,js}")],

  synchronize: false,

  logging: process.env.NODE_ENV === "development",
});
