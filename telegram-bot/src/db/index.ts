import { createDb, schema } from "@upstream/shared";
import { env } from "../config.js";

export const db = createDb(env.DATABASE_URL);
export { schema };
