import { getStore } from "@netlify/blobs";
import { serveEnvelopeVideo } from "../../lib/envelope-video-service.mjs";

// Grok re-letters the wax seal in our envelope film; finished films are kept in the "envelope-films" store. Needs XAI_API_KEY and AI_VIDEO_ACCESS_CODE (Functions scope).
export default async (request) => {
  const env = (name) => globalThis.Netlify?.env?.get(name) ?? process.env[name] ?? "";
  const blobs = getStore({ name: `envelope-video-jobs-${env("CONTEXT") || "production"}`, consistency: "strong" });
  const filmStore = getStore({ name: "envelope-films", consistency: "strong" });
  return serveEnvelopeVideo(request, { apiKey: env("XAI_API_KEY"), accessCode: env("AI_VIDEO_ACCESS_CODE"), openAccess: true,
    films: { get: (id) => filmStore.get(id, { type: "arrayBuffer" }), set: (id, bytes) => filmStore.set(id, bytes) }, store: {
    get: (key) => blobs.get(key, { type: "json" }),
    set: (key, job) => blobs.setJSON(key, job),
    claim: async (key, job) => (await blobs.setJSON(key, job, { onlyIfNew: true })).modified,
  } });
};
export const config = { path: "/api/envelope-video/*", rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 30 } };
