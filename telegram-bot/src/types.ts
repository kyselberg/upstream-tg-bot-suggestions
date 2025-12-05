import { Context, SessionFlavor } from "grammy";
import { type SessionData } from "./state.js";

export type BotContext = Context & SessionFlavor<SessionData>;
