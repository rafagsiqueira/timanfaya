import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof create> | undefined;
function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}

// Lazy so `next build` doesn't need a database connection.
export const db = new Proxy({} as ReturnType<typeof create>, {
  get: (_t, prop) => Reflect.get((_db ??= create()), prop),
});
export { schema };
