import { Bot, InlineKeyboard } from "grammy";
import {
  ATTACHMENT_BUTTONS,
  FEEDBACK_TYPE_BUTTONS,
  IDENTITY_BUTTONS,
  RELATION_BUTTONS,
  env,
} from "../config.js";
import { MESSAGES } from "../messages.js";
import {
  createFeedbackWithAttachments,
  createOrGetUserFromSession,
} from "../services/feedback.js";
import { buildAttachmentKey, uploadFromUrl } from "../services/s3.js";
import {
  buildAttachmentKeyboard,
  sendAdminCard,
} from "../services/telegram.js";
import {
  initialSession,
  type FeedbackType,
  type IdentityMode,
  type Relation,
} from "../state.js";
import { type BotContext } from "../types.js";
import { truncateText } from "../utils.js";

const identityKeyboard = new InlineKeyboard()
  .text(IDENTITY_BUTTONS.anonymous, "id:anonymous")
  .row()
  .text(IDENTITY_BUTTONS.name, "id:name")
  .row()
  .text(IDENTITY_BUTTONS.nameAndContact, "id:name_and_contact");

const relationKeyboard = new InlineKeyboard()
  .text(RELATION_BUTTONS.member, "rel:member")
  .text(RELATION_BUTTONS.guest, "rel:guest")
  .row()
  .text(RELATION_BUTTONS.volunteer, "rel:volunteer")
  .text(RELATION_BUTTONS.other, "rel:other");

const typeKeyboard = new InlineKeyboard()
  .text(FEEDBACK_TYPE_BUTTONS.idea, "type:idea")
  .row()
  .text(FEEDBACK_TYPE_BUTTONS.problem, "type:problem")
  .row()
  .text(FEEDBACK_TYPE_BUTTONS.thanks, "type:thanks")
  .row()
  .text(FEEDBACK_TYPE_BUTTONS.question, "type:question");

function resetSession(ctx: BotContext) {
  ctx.session = initialSession();
}

async function sendIdentityPrompt(ctx: BotContext) {
  resetSession(ctx);
  ctx.session.state = "asking_identity";
  await ctx.reply(MESSAGES.start, { reply_markup: identityKeyboard });
}

async function sendTypePrompt(ctx: BotContext) {
  ctx.session.state = "asking_type";
  ctx.session.identityStep = undefined;
  await ctx.reply(MESSAGES.askType, { reply_markup: typeKeyboard });
}

async function handleSubmission(ctx: BotContext) {
  if (!ctx.session.feedbackType || !ctx.session.feedbackText) {
    await ctx.reply(
      "Немає тексту або типу відгуку. Напиши /start, щоб почати заново."
    );
    resetSession(ctx);
    return;
  }

  const userId = await createOrGetUserFromSession(ctx, ctx.session);
  const feedbackId = await createFeedbackWithAttachments({
    userId,
    feedbackType: ctx.session.feedbackType,
    text: ctx.session.feedbackText,
    attachments: ctx.session.attachments,
  });

  await sendAdminCard(ctx, {
    feedbackId,
    type: ctx.session.feedbackType,
    status: "new",
    name:
      ctx.session.identityMode === "anonymous" ? undefined : ctx.session.name,
    relation: ctx.session.relation
      ? RELATION_BUTTONS[ctx.session.relation]
      : undefined,
    contact: ctx.session.contact,
    text: truncateText(ctx.session.feedbackText, 400),
    attachmentsCount: ctx.session.attachments.length,
  });

  resetSession(ctx);
  await ctx.reply(MESSAGES.finalThankYou, {
    reply_markup: { remove_keyboard: true },
  });
}

export function registerUserHandlers(bot: Bot<BotContext>) {
  bot.command(["start", "idea"], async (ctx) => {
    await sendIdentityPrompt(ctx);
  });

  bot.command("cancel", async (ctx) => {
    resetSession(ctx);
    await ctx.reply(MESSAGES.cancelled, {
      reply_markup: { remove_keyboard: true },
    });
  });

  bot.callbackQuery(/^id:/, async (ctx) => {
    const [, mode] = (ctx.callbackQuery?.data ?? "").split(":");
    if (!mode) return;
    const identityMode = mode as IdentityMode;
    ctx.session.identityMode = identityMode;
    ctx.session.state = "asking_identity_details";

    if (identityMode === "anonymous") {
      ctx.session.state = "asking_type";
      await ctx.reply(MESSAGES.anonymousSelected);
      await sendTypePrompt(ctx);
    } else {
      ctx.session.identityStep = "name";
      await ctx.reply(MESSAGES.askName);
    }

    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^rel:/, async (ctx) => {
    const [, relValue] = (ctx.callbackQuery?.data ?? "").split(":");
    if (!relValue) return;
    if (ctx.session.state !== "asking_identity_details") {
      await ctx.answerCallbackQuery({ text: "Почнімо заново: /start" });
      return;
    }

    ctx.session.relation = relValue as Relation;
    if (ctx.session.identityMode === "name_and_contact") {
      ctx.session.identityStep = "contact";
      await ctx.reply(MESSAGES.askContact);
    } else {
      await sendTypePrompt(ctx);
    }

    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^type:/, async (ctx) => {
    const [, typeValue] = (ctx.callbackQuery?.data ?? "").split(":");
    if (!typeValue) return;
    if (ctx.session.state !== "asking_type") {
      await ctx.answerCallbackQuery({
        text: "Напиши /start, щоб почати заново",
      });
      return;
    }

    ctx.session.feedbackType = typeValue as FeedbackType;
    ctx.session.state = "asking_text";

    await ctx.reply(MESSAGES.askText);
    await ctx.answerCallbackQuery();
  });

  bot.on("message:photo", async (ctx) => {
    if (ctx.session.state !== "collecting_attachments") return;
    const largest = ctx.message.photo.at(-1);
    if (!largest) return;
    const file = await ctx.api.getFile(largest.file_id);
    if (!file.file_path) return;
    const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    const key = buildAttachmentKey([
      "feedback",
      String(ctx.from?.id ?? "anon"),
      `${Date.now()}-${largest.file_unique_id}`,
    ]);

    await uploadFromUrl(fileUrl, key, "image/jpeg");
    ctx.session.attachments.push({ type: "photo", s3Key: key });

    await ctx.reply(MESSAGES.attachmentSaved, buildAttachmentKeyboard());
  });

  bot.on("message:document", async (ctx) => {
    if (ctx.session.state !== "collecting_attachments") return;
    const doc = ctx.message.document;
    const file = await ctx.api.getFile(doc.file_id);
    if (!file.file_path) return;
    const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    const key = buildAttachmentKey([
      "feedback",
      String(ctx.from?.id ?? "anon"),
      `${Date.now()}-${doc.file_unique_id ?? doc.file_id}`,
    ]);
    await uploadFromUrl(fileUrl, key, doc.mime_type ?? undefined);
    ctx.session.attachments.push({ type: "document", s3Key: key });
    await ctx.reply(MESSAGES.attachmentSaved, buildAttachmentKeyboard());
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    switch (ctx.session.state) {
      case "asking_identity_details": {
        if (ctx.session.identityStep === "name") {
          ctx.session.name = text.slice(0, 200);
          ctx.session.identityStep = "relation";
          await ctx.reply(MESSAGES.thanksName(ctx.session.name), {
            reply_markup: relationKeyboard,
          });
          return;
        }
        if (ctx.session.identityStep === "relation") {
          await ctx.reply("Обери варіант з кнопок нижче, будь ласка.", {
            reply_markup: relationKeyboard,
          });
          return;
        }
        if (ctx.session.identityStep === "contact") {
          ctx.session.contact = text.slice(0, 200);
          await sendTypePrompt(ctx);
          return;
        }
        break;
      }
      case "asking_text": {
        if (!ctx.session.feedbackText) {
          ctx.session.feedbackText = text;
          ctx.session.state = "collecting_attachments";
          await ctx.reply(MESSAGES.afterText, buildAttachmentKeyboard());
        }
        return;
      }
      case "collecting_attachments": {
        if (text === ATTACHMENT_BUTTONS.send) {
          await handleSubmission(ctx);
          return;
        }
        if (text === ATTACHMENT_BUTTONS.cancel) {
          resetSession(ctx);
          await ctx.reply(MESSAGES.cancelled, {
            reply_markup: { remove_keyboard: true },
          });
          return;
        }
        await ctx.reply(
          "Якщо готово — натисни «✅ Надіслати відгук» або «❌ Скасувати».",
          {
            reply_markup: buildAttachmentKeyboard().reply_markup,
          }
        );
        return;
      }
      default:
        break;
    }

    if (ctx.session.state === "idle") {
      await ctx.reply("Напиши /start, щоб залишити відгук.");
    }
  });
}
