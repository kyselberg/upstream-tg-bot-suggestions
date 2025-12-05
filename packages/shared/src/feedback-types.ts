import { z } from "zod";

// Feedback types
export const feedbackTypeSchema = z.enum(["idea", "problem", "thanks", "question"]);
export const feedbackStatusSchema = z.enum(["new", "seen", "in_progress", "done", "rejected"]);
export const relationSchema = z.enum(["member", "guest", "volunteer", "other"]);
export const identityModeSchema = z.enum(["anonymous", "name", "name_and_contact"]);

export type FeedbackType = z.infer<typeof feedbackTypeSchema>;
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;
export type Relation = z.infer<typeof relationSchema>;
export type IdentityMode = z.infer<typeof identityModeSchema>;

// Form submission schema
export const feedbackSubmissionSchema = z.object({
  identityMode: identityModeSchema,
  name: z.string().optional(),
  relation: relationSchema.optional(),
  contact: z.string().optional(),
  feedbackType: feedbackTypeSchema,
  text: z.string().min(1, "Текст відгуку обов'язковий"),
  attachments: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      dataUrl: z.string(),
    })
  ).optional(),
});

export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;

// Labels and constants
export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  idea: "💡 Ідея / пропозиція",
  problem: "⚠️ Проблема / скарга",
  thanks: "🙏 Подяка / історія",
  question: "❓ Питання",
};

export const RELATION_LABELS: Record<Relation, string> = {
  member: "Член церкви",
  guest: "Гість",
  volunteer: "Волонтер / служитель",
  other: "Інше",
};

export const IDENTITY_LABELS: Record<IdentityMode, string> = {
  anonymous: "Залишитись анонімно",
  name: "Назвати ім'я",
  name_and_contact: "Ім'я + контакт для відповіді",
};

