import { relations } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import * as pgCore from "drizzle-orm/pg-core";

export const relationEnum = pgEnum("relation", [
  "member",
  "guest",
  "volunteer",
  "other",
]);
export const feedbackTypeEnum = pgEnum("feedback_type", [
  "idea",
  "problem",
  "thanks",
  "question",
]);
export const feedbackStatusEnum = pgEnum("feedback_status", [
  "new",
  "seen",
  "in_progress",
  "done",
  "rejected",
]);
export const attachmentTypeEnum = pgEnum("attachment_type", [
  "photo",
  "document",
  "other",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramId: text("telegram_id").unique(),
  name: text("name"),
  relation: relationEnum("relation"),
  contact: text("contact"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  type: feedbackTypeEnum("type").notNull(),
  status: feedbackStatusEnum("status").notNull().default("new"),
  text: text("text").notNull(),
  likesCount: pgCore.integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackId: uuid("feedback_id")
    .references(() => feedback.id)
    .notNull(),
  type: attachmentTypeEnum("type").notNull(),
  s3Key: text("s3_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable("sessions", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackId: uuid("feedback_id")
    .references(() => feedback.id, { onDelete: "cascade" })
    .notNull(),
  fingerprint: text("fingerprint").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => ({
  uniqueLike: pgCore.unique("unique_feedback_fingerprint").on(table.feedbackId, table.fingerprint),
}));

export const feedbackRelations = relations(feedback, ({ many, one }) => ({
  attachments: many(attachments),
  likes: many(likes),
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  feedback: one(feedback, {
    fields: [attachments.feedbackId],
    references: [feedback.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  feedback: one(feedback, {
    fields: [likes.feedbackId],
    references: [feedback.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  feedback: many(feedback),
}));

export type User = typeof users.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Like = typeof likes.$inferSelect;

