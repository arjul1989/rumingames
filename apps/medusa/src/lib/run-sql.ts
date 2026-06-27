import pg from "pg"

const { Client } = pg

/** Run a single SQL statement against DATABASE_URL (works in Cloud Run; no psql binary). */
export async function runSql(
  sql: string,
  params: unknown[] = []
): Promise<pg.QueryResult> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error("DATABASE_URL is required for SQL operations")

  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  try {
    return await client.query(sql, params)
  } finally {
    await client.end()
  }
}
