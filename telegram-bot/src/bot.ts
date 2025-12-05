import { Bot, session } from "grammy";
import { env } from "./config.js";
import { registerAdminHandlers } from "./handlers/admin.js";
import { registerUserHandlers } from "./handlers/user.js";
import { DrizzleSessionAdapter } from "./session.js";
import { initialSession } from "./state.js";
import { type BotContext } from "./types.js";

const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);

bot.use(
  session({
    initial: initialSession,
    storage: new DrizzleSessionAdapter(),
  })
);

registerUserHandlers(bot);
registerAdminHandlers(bot);

bot.catch((err) => {
  console.error("Bot error:", err);
});

if (env.WEBHOOK_URL) {
  await bot.api.setWebhook(env.WEBHOOK_URL);
  console.log(`Webhook set to ${env.WEBHOOK_URL}`);
} else {
  await bot.start();
}
