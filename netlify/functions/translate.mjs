import { serveTranslation } from "../../lib/google-translate-service.mjs";

export default async (request) => serveTranslation(request);
export const config = { path: "/api/translate" };
