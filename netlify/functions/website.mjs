import { getStore } from "@netlify/blobs";
import { serveWebsite } from "../../lib/website-service.mjs";

export default async (request) => {
  try { return await serveWebsite(request, getStore({ name: "wedding-websites", consistency: "strong" })); }
  catch { return Response.json({ error: "Could not save or load the website. Please try again." }, { status: 503 }); }
};
export const config = { path: ["/api/website", "/api/website/*"] };
