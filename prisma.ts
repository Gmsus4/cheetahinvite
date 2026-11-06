import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { useExplicitSslMode as explicitSslMode } from "./postgres-url";

const globalForPrisma = globalThis as unknown as {
  cheetahInvitePrisma?: { schemaKey: string; client: PrismaClient };
};

const configuredConnectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/cheetahinvite";
const connectionString = explicitSslMode(configuredConnectionString);

const adapter = new PrismaPg({ connectionString });

// Regenerated models must not reuse a client from the previous schema.
const schemaKey = Object.entries(Prisma)
  .filter(([name]) => name.endsWith("ScalarFieldEnum"))
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([name, fields]) => `${name}:${Object.values(fields).sort().join(",")}`).join(";");
const cached = globalForPrisma.cheetahInvitePrisma;
export const prisma = cached?.schemaKey === schemaKey
  ? cached.client
  : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  if (cached && cached.client !== prisma) void cached.client.$disconnect();
  globalForPrisma.cheetahInvitePrisma = { schemaKey, client: prisma };
}
