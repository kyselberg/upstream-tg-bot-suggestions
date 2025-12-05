import { eq } from "drizzle-orm";
import { Bot } from "grammy";
import { env } from "../config.js";
import { db, schema } from "../db/index.js";
import { listStats } from "../services/feedback.js";
import { buildStatusKeyboard, formatAdminCard } from "../services/telegram.js";
import { type FeedbackStatus } from "../state.js";
import { type BotContext } from "../types.js";
import { truncateText } from "../utils.js";

const STATUS_MAP: Record<string, FeedbackStatus> = {
  seen: "seen",
  in_progress: "in_progress",
  done: "done",
  rejected: "rejected",
};

export function registerAdminHandlers(bot: Bot<BotContext>) {
  bot.callbackQuery(/^fb:/, async (ctx) => {
    const data = ctx.callbackQuery?.data ?? "";
    const [, feedbackId, statusKey] = data.split(":");
    const newStatus = STATUS_MAP[statusKey];
    const messageChatId = ctx.callbackQuery?.message?.chat.id;

    if (!feedbackId || !newStatus) {
      await ctx.answerCallbackQuery();
      return;
    }
    if (messageChatId !== env.ADMIN_CHAT_ID) {
      await ctx.answerCallbackQuery({ text: "Недоступно", show_alert: false });
      return;
    }

    await db
      .update(schema.feedback)
      .set({ status: newStatus })
      .where(eq(schema.feedback.id, feedbackId));

    const updated = await db.query.feedback.findFirst({
      where: eq(schema.feedback.id, feedbackId),
      with: {
        user: true,
        attachments: true,
      },
    });

    if (!updated) {
      await ctx.answerCallbackQuery({ text: "Не знайдено" });
      return;
    }

    const text = formatAdminCard({
      feedbackId,
      type: updated.type,
      status: updated.status ?? "new",
      name: updated.user?.name ?? undefined,
      relation: updated.user?.relation ?? undefined,
      contact: updated.user?.contact ?? undefined,
      text: truncateText(updated.text, 350),
      attachmentsCount: updated.attachments?.length ?? 0,
    });

    await ctx.editMessageText(text, {
      reply_markup: buildStatusKeyboard(feedbackId),
    });
    const adminName = ctx.from?.first_name ?? "Адмін";
    await ctx.answerCallbackQuery({
      text: `Статус заявки оновлено (${adminName})`,
      show_alert: false,
    });
  });

  bot.command(["stats_today", "stats_week"], async (ctx) => {
    if (ctx.chat?.id !== env.ADMIN_CHAT_ID) return;
    const isToday = ctx.message?.text?.includes("stats_today");
    const period = isToday ? "today" : "week";
    const stats = await listStats(period);
    const title =
      period === "today"
        ? "📊 Статистика за сьогодні:"
        : "📊 Статистика за останні 7 днів:";
    const lines = [
      title,
      `– Нових: ${stats.new}`,
      `– Переглянуто: ${stats.seen}`,
      `– В роботі: ${stats.in_progress}`,
      `– Виконано: ${stats.done}`,
      `– Неактуально: ${stats.rejected}`,
    ];
    await ctx.reply(lines.join("\n"));
  });
}
