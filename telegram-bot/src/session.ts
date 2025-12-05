import { eq } from "drizzle-orm";
import { type StorageAdapter } from "grammy";
import { db, schema } from "./db/index.js";
import { type SessionData } from "./state.js";

export class DrizzleSessionAdapter implements StorageAdapter<SessionData> {
  async read(key: string): Promise<SessionData | undefined> {
    const row = await db.query.sessions.findFirst({
      where: eq(schema.sessions.key, key),
    });
    return row?.data as SessionData | undefined;
  }

  async write(key: string, value: SessionData): Promise<void> {
    await db
      .insert(schema.sessions)
      .values({ key, data: value })
      .onConflictDoUpdate({
        target: schema.sessions.key,
        set: {
          data: value,
          updatedAt: new Date(),
        },
      });
  }

  async delete(key: string): Promise<void> {
    await db.delete(schema.sessions).where(eq(schema.sessions.key, key));
  }
}
