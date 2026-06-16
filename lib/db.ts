import "server-only";

import { Pool } from "pg";

declare global {
  var genyPickPool: Pool | undefined;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDemoDataEnabled(): boolean {
  return process.env.ENABLE_DEMO_DATA === "true" || process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
}

export function shouldUseDemoData(): boolean {
  return !hasDatabase() && (!isProductionRuntime() || isDemoDataEnabled());
}

export function getPool(): Pool | undefined {
  if (!process.env.DATABASE_URL) return undefined;
  if (!global.genyPickPool) {
    global.genyPickPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000
    });
  }
  return global.genyPickPool;
}

export async function dbQuery<T = Record<string, unknown>>(sql: string, values: unknown[] = []): Promise<T[]> {
  const pool = getPool();
  if (!pool) return [];
  const result = await pool.query(sql, values);
  return result.rows as T[];
}

export function assertAdminSecret(value?: string | null): void {
  if (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET.length < 16) {
    throw new Error("ADMIN_SECRET is not configured");
  }
  if (!value || value !== process.env.ADMIN_SECRET) {
    throw new Error("Unauthorized admin request");
  }
}
