const TARGET = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const rateWindows = new Map();

function withinRateLimit(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = rateWindows.get(ip);
  if (!entry || now - entry.start >= 60_000) { rateWindows.set(ip, { start: now, count: 1 }); return true; }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers });

export async function serveTranslation(request, apiKey = process.env.GOOGLE_TRANSLATE_API_KEY) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    if (!apiKey) return json({ error: "Google Translation is not configured." }, 503);
    const target = url.searchParams.get("target") || "en";
    if (!TARGET.test(target)) return json({ error: "Unsupported language code." }, 400);
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2/languages?target=${encodeURIComponent(target)}`, {
        headers: { "x-goog-api-key": apiKey }, cache: "force-cache",
      });
      const payload = await response.json();
      if (!response.ok) return json({ error: "Google language list request failed." }, 502);
      return json({ languages: payload?.data?.languages ?? [] }, 200, { "Cache-Control": "public, max-age=86400" });
    } catch {
      return json({ error: "Google Translation is unavailable." }, 502);
    }
  }

  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { Allow: "GET, POST" });
  if (!apiKey) return json({ error: "Google Translation is not configured." }, 503);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid request." }, 400); }

  const { target, text } = body ?? {};
  if (!TARGET.test(target ?? "") || target === "en" || !Array.isArray(text) || text.length < 1 || text.length > 100 || text.some((value) => typeof value !== "string" || value.length > 5000) || text.reduce((total, value) => total + (typeof value === "string" ? value.length : 0), 0) > 25_000) {
    return json({ error: "Unsupported translation request." }, 400);
  }
  if (!withinRateLimit(request)) return json({ error: "Translation request limit reached. Try again shortly." }, 429);

  try {
    const response = await fetch("https://translation.googleapis.com/language/translate/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", "x-goog-api-key": apiKey },
      body: JSON.stringify({ q: text, target, format: "text" }),
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) return json({ error: "Google Translation request failed." }, 502);
    const translations = payload?.data?.translations?.map((item) => item.translatedText);
    if (!Array.isArray(translations) || translations.length !== text.length) return json({ error: "Google returned an incomplete translation." }, 502);
    return json({ translations });
  } catch {
    return json({ error: "Google Translation is unavailable." }, 502);
  }
}
