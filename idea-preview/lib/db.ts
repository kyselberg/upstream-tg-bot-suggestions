import { createDb, schema } from "@upstream/shared";

let _db: ReturnType<typeof createDb> | null = null;

function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      const error = new Error("DATABASE_URL is not set");
      console.error("Database configuration error:", error.message);
      console.error(
        "Available env vars:",
        Object.keys(process.env).filter(
          (key) => key.includes("DATABASE") || key.includes("DB")
        )
      );
      throw error;
    }
    try {
      _db = createDb(process.env.DATABASE_URL);
    } catch (error) {
      console.error("Failed to create database connection:", error);
      throw error;
    }
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof createDb>];
  },
});

export { schema };
