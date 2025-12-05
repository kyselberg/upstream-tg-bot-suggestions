import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Helper to extract bucket name from URL if someone pastes console URL
function extractBucketName(value: string): string {
  // If it's a URL, extract the bucket name from the path
  if (value.includes("://")) {
    try {
      const url = new URL(value);
      // Handle console URLs like: https://eu-central-1.console.aws.amazon.com/s3/buckets/upstream-feedback-bot
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.indexOf("buckets");
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts[bucketIndex + 1];
      }
      // Handle s3:// URLs
      if (url.protocol === "s3:") {
        return url.hostname || url.pathname.split("/")[0];
      }
    } catch {
      // If URL parsing fails, try to extract bucket name manually
      const match = value.match(/buckets\/([^\/\?]+)/);
      if (match) return match[1];
    }
  }
  // If it contains slashes but isn't a URL, it might be a path - take the last part
  if (value.includes("/")) {
    return value.split("/").pop() || value;
  }
  return value;
}

const EnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  ADMIN_CHAT_ID: z.coerce.number(),
  DATABASE_URL: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET: z.string().transform(extractBucketName),
  S3_REGION: z.string(),
  WEBHOOK_URL: z.string().optional().default(""),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);

export const IDENTITY_BUTTONS = {
  anonymous: "Залишитись анонімно",
  name: "Назвати ім’я",
  nameAndContact: "Ім’я + контакт для відповіді",
} as const;

export const RELATION_BUTTONS = {
  member: "Член церкви",
  guest: "Гість",
  volunteer: "Волонтер / служитель",
  other: "Інше",
} as const;

export const FEEDBACK_TYPE_BUTTONS = {
  idea: "💡 Ідея / пропозиція",
  problem: "⚠️ Проблема / скарга",
  thanks: "🙏 Подяка / історія",
  question: "❓ Питання",
} as const;

export const ATTACHMENT_BUTTONS = {
  send: "✅ Надіслати відгук",
  cancel: "❌ Скасувати",
} as const;

export const STATUS_BUTTONS = {
  seen: "👀 Переглянуто",
  in_progress: "🔁 В роботі",
  done: "✅ Виконано",
  rejected: "🗑️ Неактуально",
} as const;
