import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  cheetahInvitePrismaWithCustomSections?: PrismaClient;
};

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/cheetahinvite";

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.cheetahInvitePrismaWithCustomSections ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.cheetahInvitePrismaWithCustomSections = prisma;
}
