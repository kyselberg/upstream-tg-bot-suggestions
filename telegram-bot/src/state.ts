import {
  ATTACHMENT_BUTTONS,
  FEEDBACK_TYPE_BUTTONS,
  IDENTITY_BUTTONS,
  RELATION_BUTTONS,
  STATUS_BUTTONS,
} from "./config.js";

export type BotState =
  | "idle"
  | "asking_identity"
  | "asking_identity_details"
  | "asking_type"
  | "asking_text"
  | "collecting_attachments";

export type IdentityMode = "anonymous" | "name" | "name_and_contact";
export type Relation = "member" | "guest" | "volunteer" | "other";
export type FeedbackType = "idea" | "problem" | "thanks" | "question";
export type FeedbackStatus =
  | "new"
  | "seen"
  | "in_progress"
  | "done"
  | "rejected";

export interface AttachmentDraft {
  type: "photo" | "document" | "other";
  s3Key: string;
}

export interface SessionData {
  state: BotState;
  identityMode?: IdentityMode;
  identityStep?: "name" | "relation" | "contact";
  name?: string;
  relation?: Relation;
  contact?: string;
  feedbackType?: FeedbackType;
  feedbackText?: string;
  attachments: AttachmentDraft[];
}

export const initialSession = (): SessionData => ({
  state: "idle",
  attachments: [],
});

export const BUTTON_LOOKUP = {
  identity: IDENTITY_BUTTONS,
  relation: RELATION_BUTTONS,
  feedbackType: FEEDBACK_TYPE_BUTTONS,
  attachments: ATTACHMENT_BUTTONS,
  statuses: STATUS_BUTTONS,
} as const;
