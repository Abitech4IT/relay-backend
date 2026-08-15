import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",

  testEnvironment: "node",

  roots: ["<rootDir>/tests"],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },

  testMatch: ["**/*.test.ts"],

  clearMocks: true,
};

export default config;
