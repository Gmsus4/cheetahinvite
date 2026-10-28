/* eslint-disable @typescript-eslint/no-require-imports -- Isolated public RSVP and owner export tests. */
const { createPaymentFixture } = require('./payment-fixture.cjs');
const { randomUUID } = require('node:crypto');

function createRsvpFixture(options = {}) {
  const f = createPaymentFixture(options);
  f.responses = new Map(); f.budgets = new Map(); f.eventId = options.eventId ?? 'event-fixture';
  const matches = (row, where = {}) => Object.entries(where).every(([key, expected]) => key === 'eventId_tokenHash' ? matches(row, expected)
    : expected && typeof expected === 'object' ? row[key] <= expected.lte : row[key] === expected);
  const pick = (row, select) => row && structuredClone(select ? Object.fromEntries(Object.keys(select).filter(key => select[key]).map(key => [key, row[key]])) : row);
  if (!options.prisma) {
    f.events.set(f.eventId, { id: f.eventId, ownerId: f.ownerId, name: 'Fiesta', status: 'PUBLISHED', paidAt: new Date(), expiresAt: new Date(Date.now() + 86400000), slug: 'fixture', sections: [{ id: 'confirmation', type: 'rsvp', enabled: true, rsvpMode: 'integrated' }] });
    function table(rows) {
      return {
        async findUnique({ where, select }) { return pick([...rows.values()].find(row => matches(row, where)) ?? null, select); },
        async findMany({ where, select }) { return [...rows.values()].filter(row => matches(row, where)).map(row => pick(row, select)); },
        async count({ where }) { return [...rows.values()].filter(row => matches(row, where)).length; },
        async upsert({ where, create, update }) {
          const previous = [...rows.values()].find(row => matches(row, where));
          if (previous) {
            for (const [key, value] of Object.entries(update)) previous[key] = value?.increment ? previous[key] + value.increment : value;
            previous.updatedAt = new Date(); return structuredClone(previous);
          }
          const row = { id: randomUUID(), count: 1, createdAt: new Date(), updatedAt: new Date(), ...create }; rows.set(row.key ?? row.id, row); return structuredClone(row);
        },
        async deleteMany({ where }) { const found = [...rows.entries()].filter(([, row]) => matches(row, where)); for (const [key] of found) rows.delete(key); return { count: found.length }; },
      };
    }
    f.prisma.rsvpResponse = table(f.responses); f.prisma.rsvpSubmissionBudget = table(f.budgets);
    const transaction = f.prisma.$transaction.bind(f.prisma);
    f.prisma.$transaction = (work, opts) => transaction(async tx => {
      const snapshot = structuredClone({ responses: f.responses, budgets: f.budgets });
      try { return await work(tx); } catch (error) {
        f.responses.clear(); f.budgets.clear(); snapshot.responses.forEach((v, k) => f.responses.set(k, v)); snapshot.budgets.forEach((v, k) => f.budgets.set(k, v)); throw error;
      }
    }, opts);
  }
  f.route = f.load('app/api/events/[id]/rsvp/route.ts'); f.exportRoute = f.load('app/api/events/[id]/rsvp/export/route.ts');
  f.values = { token: 'a'.repeat(64), name: 'Ana Pérez', attending: true, companions: 5 };
  f.submit = (values = f.values, headers = {}) => f.route.POST(new Request(`http://localhost:3000/api/events/${f.eventId}/rsvp`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', ...headers }, body: JSON.stringify(values) }), { params: Promise.resolve({ id: f.eventId }) });
  f.read = (token = f.values.token) => f.route.GET(new Request(`http://localhost:3000/api/events/${f.eventId}/rsvp`, { headers: { Authorization: `Bearer ${token}` } }), { params: Promise.resolve({ id: f.eventId }) });
  f.csv = () => f.exportRoute.GET(new Request(`http://localhost:3000/api/events/${f.eventId}/rsvp/export`), { params: Promise.resolve({ id: f.eventId }) });
  return f;
}
module.exports = { createRsvpFixture };
