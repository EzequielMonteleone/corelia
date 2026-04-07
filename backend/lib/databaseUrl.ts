/**
 * Resolves the Postgres URL for Prisma + @prisma/adapter-pg.
 *
 * Neon pooler hostnames contain `-pooler.`; the direct endpoint is the same host
 * with that segment removed (see Neon docs).
 *
 * Order: DATABASE_URL_DIRECT → DATABASE_URL → local dev default.
 * If only a pooled URL is set, we derive the direct URL automatically.
 */

export function resolveDatabaseUrl(): string {
  const fromEnv =
    process.env.DATABASE_URL_DIRECT?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    '';

  if (fromEnv.includes('-pooler.')) {
    return fromEnv.replace('-pooler.', '.');
  }

  return fromEnv;
}

export function isUsingNeonPoolerInEnv(): boolean {
  const raw =
    process.env.DATABASE_URL_DIRECT?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    '';
  return raw.includes('-pooler.');
}
