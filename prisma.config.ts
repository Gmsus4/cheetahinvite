import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { useExplicitSslMode as explicitSslMode } from "./postgres-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: explicitSslMode(env("DIRECT_URL")),
  },
});
