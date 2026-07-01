import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const checks = sqliteTable('check', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  method: text('method').notNull(),
  clientIp: text('client_ip').notNull(),
  timestamp: text('timestamp').notNull(),
});

export let db: ReturnType<typeof drizzle>;

export function getDb() {
  return db;
}

export async function initializeDatabase() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  });
  db = drizzle(client);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "check" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      client_ip TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);
}
