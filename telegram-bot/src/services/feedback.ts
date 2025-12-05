import { eq, gte, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { type AttachmentDraft, type SessionData } from "../state.js";
import { type BotContext } from "../types.js";

export async function createOrGetUserFromSession(
  ctx: BotContext,
  session: SessionData
): Promise<string | null> {
  if (session.identityMode === "anonymous") {
    return null;
  }

  const telegramId = ctx.from?.id ? String(ctx.from.id) : null;
  const existing = telegramId
    ? await db.query.users.findFirst({
        where: eq(schema.users.telegramId, telegramId),
      })
    : null;

  if (existing) {
    await db
      .update(schema.users)
      .set({
        name: session.name ?? existing.name,
        relation: session.relation ?? existing.relation,
        contact: session.contact ?? existing.contact,
      })
      .where(eq(schema.users.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(schema.users)
    .values({
      telegramId: telegramId ?? null,
      name: session.name,
      relation: session.relation,
      contact: session.contact,
    })
    .returning({ id: schema.users.id });

  return inserted?.id ?? null;
}

export async function createFeedbackWithAttachments(params: {
  userId: string | null;
  feedbackType: SessionData["feedbackType"];
  text: string;
  attachments: AttachmentDraft[];
}) {
  const [feedbackRow] = await db
    .insert(schema.feedback)
    .values({
      userId: params.userId ?? null,
      type: params.feedbackType ?? "idea",
      text: params.text,
    })
    .returning({ id: schema.feedback.id });

  const feedbackId = feedbackRow?.id;
  if (!feedbackId) {
    throw new Error("Failed to create feedback");
  }

  if (params.attachments.length) {
    await db.insert(schema.attachments).values(
      params.attachments.map((att) => ({
        feedbackId,
        type: att.type,
        s3Key: att.s3Key,
      }))
    );
  }

  return feedbackId;
}

export type StatusCounts = Record<
  "new" | "seen" | "in_progress" | "done" | "rejected",
  number
>;

export async function listStats(
  period: "today" | "week"
): Promise<StatusCounts> {
  const now = new Date();
  const since =
    period === "today"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      status: schema.feedback.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.feedback)
    .where(gte(schema.feedback.createdAt, since))
    .groupBy(schema.feedback.status);

  const base: StatusCounts = {
    new: 0,
    seen: 0,
    in_progress: 0,
    done: 0,
    rejected: 0,
  };

  for (const row of rows) {
    const status = row.status ?? "new";
    base[status] = Number(row.count);
  }

  return base;
}
