// Mocked checks for the envelope film service. No real xAI request is made.
import test from "node:test";
import assert from "node:assert/strict";
import { serveEnvelopeVideo, sealLetters, estimateEnvelopeCents } from "../lib/envelope-video-service.mjs";

const code = "test-owner-access-code-12345";
const mp4 = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109]); // "....ftypisom"
const jpeg = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 224, 1, 2, 3]).toString("base64")}`;
function setup(fetcher) {
  const data = new Map(), saved = new Map();
  const deps = { apiKey: "fake-key-for-tests", accessCode: code, now: 1000000,
    fetcher: fetcher || (() => { throw new Error("Unexpected provider request"); }),
    films: { get: async (id) => saved.get(id) ?? null, set: async (id, bytes) => saved.set(id, bytes) },
    store: { get: async (k) => data.get(k), set: async (k, v) => data.set(k, v), claim: async (k, v) => { if (data.has(k)) return false; data.set(k, v); return true; } } };
  const headers = { "x-ai-access-code": code, origin: "https://test.example" };
  const call = (action, body, extra = {}) => serveEnvelopeVideo(new Request(`https://test.example/api/envelope-video/${action}`, { method: "POST", headers: { "content-type": "application/json", ...headers, ...extra }, body: JSON.stringify(body) }), deps);
  const upload = (token, bytes) => serveEnvelopeVideo(new Request(`https://test.example/api/envelope-video/film?token=${encodeURIComponent(token)}`, { method: "POST", headers: { "content-type": "video/mp4", ...headers }, body: bytes }), deps);
  const get = (path, extra = {}) => serveEnvelopeVideo(new Request(`https://test.example/api/envelope-video/${path}`, { headers: extra }), deps);
  return { call, upload, get };
}

test("seal letters are checked", () => {
  assert.equal(sealLetters("  a  &  m "), "a & m");
  assert.throws(() => sealLetters(""));
  assert.throws(() => sealLetters("Aarav & Meera"));
  assert.throws(() => sealLetters("<b>"));
});

test("config and quote make no provider calls and never reveal the key", async () => {
  const { get, call } = setup();
  const config = await (await get("config")).json();
  assert.equal(config.ready, true); assert.equal(config.estimatedCents, estimateEnvelopeCents());
  const q = await (await call("quote", { letters: "K & P" })).json();
  assert.match(q.prompt, /^Completely remove the monogram text "R&Z" from the red wax seal and replace it with elegant golden cursive script text "K & P"\./);
  assert.ok(!JSON.stringify(q).includes("fake-key-for-tests"));
});

test("a wrong access code is refused", async () => {
  const { call } = setup();
  assert.equal((await call("quote", { letters: "K & P" }, { "x-ai-access-code": "wrong" })).status, 403);
});

test("seal edits the close-up once; the uploaded film is saved, served in ranges and reused for the same letters", async () => {
  const posts = [];
  const { call, upload, get } = setup(async (href, init) => {
    assert.equal(href, "https://api.x.ai/v1/images/edits"); posts.push(JSON.parse(init.body));
    return Response.json({ data: [{ b64_json: "QUJD", mime_type: "image/png" }] });
  });
  const q = await (await call("quote", { letters: "K & P" })).json();
  assert.equal((await upload(q.token, mp4)).status, 409); // no film before Grok's seal
  assert.equal((await call("seal", { token: q.token, image: jpeg })).status, 400); // not confirmed
  const seal = await (await call("seal", { token: q.token, confirmed: true, image: jpeg })).json();
  assert.equal(seal.state, "done"); assert.equal(seal.image, "data:image/png;base64,QUJD");
  await call("seal", { token: q.token, confirmed: true, image: jpeg }); // a repeat is not sent again
  assert.equal(posts.length, 1); assert.equal(posts[0].image.url, jpeg); assert.match(posts[0].prompt, /"K & P"/);
  assert.equal((await upload(q.token, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))).status, 400); // not an MP4
  const done = await (await upload(q.token, mp4)).json();
  assert.match(done.film, /^\/api\/envelope-video\/film\/[a-f0-9-]{36}$/);
  const path = done.film.replace("/api/envelope-video/", "");
  assert.deepEqual(new Uint8Array(await (await get(path)).arrayBuffer()), mp4);
  const part = await get(path, { range: "bytes=4-7" });
  assert.equal(part.status, 206); assert.equal(String.fromCharCode(...new Uint8Array(await part.arrayBuffer())), "ftyp");
  const again = await (await call("quote", { letters: "K & P" })).json();
  assert.equal(again.state, "done"); assert.equal(again.film, done.film); assert.equal(again.token, undefined);
});

test("a failed seal is reported and never retried", async () => {
  let n = 0;
  const { call } = setup(async () => { n += 1; return Response.json({}, { status: 402 }); });
  const q = await (await call("quote", { letters: "A & M" })).json();
  const job = await (await call("seal", { token: q.token, confirmed: true, image: jpeg })).json();
  assert.equal(job.state, "failed"); assert.match(job.error, /credits/);
  await call("seal", { token: q.token, confirmed: true, image: jpeg });
  assert.equal(n, 1);
});
