import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { useExplicitSslMode } from "./postgres-url";

const globalForPrisma = globalThis as unknown as {
  cheetahInvitePrismaWithCustomSections?: PrismaClient;
};

const configuredConnectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/cheetahinvite";
const connectionString = useExplicitSslMode(configuredConnectionString);

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.cheetahInvitePrismaWithCustomSections ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.cheetahInvitePrismaWithCustomSections = prisma;
}
