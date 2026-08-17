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

  testTimeout: 30000,

  clearMocks: true,

  restoreMocks: true,
};

export default config;
