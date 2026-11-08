/* eslint-disable @typescript-eslint/no-require-imports -- Explicit operator command; never used by registration. */
require('dotenv/config');
const { Client } = require('pg');
const { useExplicitSslMode } = require('../postgres-url.ts');

async function main() {
  const [operation, email] = process.argv.slice(2);
  if (!['grant', 'revoke'].includes(operation) || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || process.argv.length !== 4) throw Error('Uso: npm run admin:access -- grant|revoke correo@ejemplo.com');
  const connection = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connection) throw Error('Configura DIRECT_URL o DATABASE_URL antes de continuar.');
  const client = new Client({ connectionString: useExplicitSslMode(connection), connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    await client.query('BEGIN');
    const account = await client.query('SELECT "id", "role" FROM "User" WHERE lower("email") = lower($1) FOR UPDATE', [email.trim()]);
    if (account.rows.length !== 1) throw Error('No se encontró una única cuenta existente con ese correo. Regístrala primero desde el login habitual.');
    const role = operation === 'grant' ? 'ADMIN' : 'USER';
    await client.query('UPDATE "User" SET "role" = $1 WHERE "id" = $2', [role, account.rows[0].id]);
    await client.query('INSERT INTO "AdminAudit" ("id", "actorId", "action", "targetId", "detail") VALUES (gen_random_uuid()::text, $1, $2, $1, $3::jsonb)', [account.rows[0].id, 'admin.' + operation, JSON.stringify({ method: 'operator-command', previousRole: account.rows[0].role, role })]);
    await client.query('COMMIT');
    console.log(operation === 'grant' ? 'Acceso de administrador asignado a la cuenta existente. Entra por /login y abre /admin.' : 'Acceso de administrador retirado.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    // Never print connection URLs or provider error objects.
    throw new Error(error.message?.startsWith('No se encontró') ? error.message : 'No se pudo actualizar el acceso. Comprueba la conexión y las migraciones.');
  } finally { await client.end(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
