import { InlineKeyboard } from "grammy";
import {
  ATTACHMENT_BUTTONS,
  FEEDBACK_TYPE_BUTTONS,
  STATUS_BUTTONS,
  env,
} from "../config.js";
import { type FeedbackStatus, type FeedbackType } from "../state.js";
import { type BotContext } from "../types.js";

const STATUS_LABELS: Record<FeedbackStatus | "new", string> = {
  new: "🆕 Нова",
  seen: STATUS_BUTTONS.seen,
  in_progress: STATUS_BUTTONS.in_progress,
  done: STATUS_BUTTONS.done,
  rejected: STATUS_BUTTONS.rejected,
};

const TYPE_LABELS: Record<FeedbackType, string> = {
  idea: FEEDBACK_TYPE_BUTTONS.idea,
  problem: FEEDBACK_TYPE_BUTTONS.problem,
  thanks: FEEDBACK_TYPE_BUTTONS.thanks,
  question: FEEDBACK_TYPE_BUTTONS.question,
};

export function buildStatusKeyboard(feedbackId: string) {
  return new InlineKeyboard()
    .text(STATUS_BUTTONS.seen, `fb:${feedbackId}:seen`)
    .text(STATUS_BUTTONS.in_progress, `fb:${feedbackId}:in_progress`)
    .row()
    .text(STATUS_BUTTONS.done, `fb:${feedbackId}:done`)
    .text(STATUS_BUTTONS.rejected, `fb:${feedbackId}:rejected`);
}

export function formatAdminCard(params: {
  feedbackId: string;
  type: FeedbackType;
  status: FeedbackStatus | "new";
  name?: string;
  relation?: string | null;
  contact?: string | null;
  text: string;
  attachmentsCount: number;
}) {
  const title = params.status === "new" ? "Нова заявка" : "Заявка";
  const lines = [
    `📨 ${title} #${params.feedbackId.slice(0, 8)}`,
    "",
    `Тип: ${TYPE_LABELS[params.type]}`,
    `Статус: ${STATUS_LABELS[params.status]}`,
    "",
    "Від:",
    `– ${params.name ?? "Анонімно"}`,
    `– Статус в церкві: ${params.relation ?? "—"}`,
    "",
    `Контакт: ${params.contact ?? "—"}`,
    "",
    "Текст:",
    `«${params.text}»`,
    "",
    `Вкладення: ${
      params.attachmentsCount > 0
        ? `${params.attachmentsCount} файл(и) в S3`
        : "немає"
    }`,
  ];
  return lines.join("\n");
}

export async function sendAdminCard(
  ctx: BotContext,
  params: Parameters<typeof formatAdminCard>[0]
) {
  const text = formatAdminCard(params);
  const keyboard = buildStatusKeyboard(params.feedbackId);
  await ctx.api.sendMessage(env.ADMIN_CHAT_ID, text, {
    reply_markup: keyboard,
  });
}

export function buildAttachmentKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: ATTACHMENT_BUTTONS.send }],
        [{ text: ATTACHMENT_BUTTONS.cancel }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
}
