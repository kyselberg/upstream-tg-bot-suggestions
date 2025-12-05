import { createDb, schema } from "@upstream/shared";

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    _db = createDb(process.env.DATABASE_URL);
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof createDb>];
  },
});

export { schema };

