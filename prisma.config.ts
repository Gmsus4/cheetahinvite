import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { useExplicitSslMode } from "./postgres-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: useExplicitSslMode(env("DIRECT_URL")),
  },
});
