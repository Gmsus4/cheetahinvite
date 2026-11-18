import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { useExplicitSslMode as explicitSslMode } from "./postgres-url";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const globalForPrisma = globalThis as unknown as {
  cheetahInvitePrisma?: { schemaKey: string; poolKey: string; client: PrismaClient };
};

const configuredConnectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/cheetahinvite";
const connectionString = explicitSslMode(configuredConnectionString);
// OpenNext also provides a Cloudflare context during `next dev`, which still
// runs PostgreSQL in Node. Only workerd needs request-owned sockets.
const isWorkersRuntime = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
const poolConfig = {
  connectionString,
  max: 3,
  // Allow a suspended database to wake up and complete its TLS handshake.
  connectionTimeoutMillis: 15_000,
  ...(isWorkersRuntime ? { maxUses: 1 } : {}),
};
const poolKey = JSON.stringify(poolConfig);

function createClient() {
  // maxUses=1 closes the socket on release, including interactive transactions.
  // Workers sockets may only be used by the request that opened them.
  const adapter = new PrismaPg(poolConfig);
  return new PrismaClient({ adapter });
}

// Regenerated models must not reuse a client from the previous schema.
const schemaKey = Object.entries(Prisma)
  .filter(([name]) => name.endsWith("ScalarFieldEnum"))
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([name, fields]) => `${name}:${Object.values(fields).sort().join(",")}`).join(";");
const cached = globalForPrisma.cheetahInvitePrisma;
const nodeClient = cached?.schemaKey === schemaKey && cached.poolKey === poolKey
  ? cached.client
  : createClient();

if (process.env.NODE_ENV !== "production") {
  if (cached && cached.client !== nodeClient) void cached.client.$disconnect();
  globalForPrisma.cheetahInvitePrisma = { schemaKey, poolKey, client: nodeClient };
}

const requestClients = new WeakMap<object, PrismaClient>();
function currentClient() {
  if (!isWorkersRuntime) return nodeClient; // Next dev, CLI and Node test runner.
  const context = getCloudflareContext().ctx;
  let client = requestClients.get(context);
  if (!client) { client = createClient(); requestClients.set(context, client); }
  return client;
}

// Keep existing imports and Auth.js adapter behavior while resolving the client
// inside each operation, after OpenNext has installed the request context.
export const prisma = new Proxy(nodeClient, {
  get(_target, property) {
    const client = currentClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
