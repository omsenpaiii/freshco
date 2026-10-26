import 'server-only'
import { Pool, type QueryResultRow } from '@neondatabase/serverless'

let pool: Pool | undefined

export function isNeonConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

export function getNeonPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL })
  return pool
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getNeonPool().query<T>(text, values)
}
