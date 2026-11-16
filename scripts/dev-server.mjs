import http from "node:http";
import net from "node:net";
import path from "node:path";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import next from "next";
import { serveInvitation } from "../lib/invitation-service.mjs";
import { serveAiVideo } from "../lib/ai-video-service.mjs";
import { serveEnvelopeVideo } from "../lib/envelope-video-service.mjs";
import { serveTranslation } from "../lib/google-translate-service.mjs";
import { serveWebsite } from "../lib/website-service.mjs";

const port = Number(process.env.PORT || 3000);
// Check before Next prepares its cache: a second dev process must not rebuild
// files underneath the server that already owns this port.
try {
    await new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.once("error", reject);
        probe.listen(port, () => probe.close(resolve));
    });
} catch (error) {
    console.error(error.code === "EADDRINUSE" ? `Port ${port} is already in use. Stop the existing dev server before running npm run dev again.` : error.message);
    process.exit(1);
}
const app = next({ dev: true, port, hostname: "localhost" });
await app.prepare();
const handle = app.getRequestHandler();
const directory = path.resolve(".local-invitations");
const store = {
    async set(id, value) { await mkdir(directory, { recursive: true }); await writeFile(path.join(directory, `${id}.json`), value); },
    async get(id) { try { return await readFile(path.join(directory, `${id}.json`), "utf8"); } catch (error) { if (error.code === "ENOENT") return null; throw error; } },
};
const siteDirectory = path.resolve(".local-websites");
const siteStore = {
    async set(slug, value) { await mkdir(siteDirectory, { recursive: true }); await writeFile(path.join(siteDirectory, `${slug}.json`), value); },
    async get(slug) { try { return await readFile(path.join(siteDirectory, `${slug}.json`), "utf8"); } catch (error) { if (error.code === "ENOENT") return null; throw error; } },
};
const aiDirectory = path.resolve(".local-ai-video");
const aiStore = {
    async list() { let names;try {names=await readdir(aiDirectory);}catch(error){if(error.code==="ENOENT")return [];throw error;}return (await Promise.all(names.filter(n=>/^job-[a-f0-9-]{36}\.json$/.test(n)).map(async name=>{try{return {key:name.slice(0,-5),job:JSON.parse(await readFile(path.join(aiDirectory,name),"utf8"))};}catch{return null;}}))).filter(Boolean); },
    async get(key) { try { return JSON.parse(await readFile(path.join(aiDirectory, `${key}.json`), "utf8")); } catch (error) { if (error.code === "ENOENT") return null; throw error; } },
    async set(key, value) { await mkdir(aiDirectory, { recursive: true }); await writeFile(path.join(aiDirectory, `${key}.json`), JSON.stringify(value)); },
    async claim(key, value) { await mkdir(aiDirectory, { recursive: true }); try { await writeFile(path.join(aiDirectory, `${key}.json`), JSON.stringify(value), { flag: "wx" }); return true; } catch (error) { if (error.code === "EEXIST") return false; throw error; } },
};
const filmDirectory = path.join(aiDirectory, "films");
const films = {
    async get(id) { try { return await readFile(path.join(filmDirectory, `${id}.mp4`)); } catch (error) { if (error.code === "ENOENT") return null; throw error; } },
    async set(id, bytes) { await mkdir(filmDirectory, { recursive: true }); await writeFile(path.join(filmDirectory, `${id}.mp4`), bytes); },
};
http.createServer(async (req, res) => {
    const ai = /^\/api\/ai-video\//.test(req.url);
    const envelope = /^\/api\/envelope-video\//.test(req.url);
    if (envelope) {
        try {
            const chunks = []; let length = 0;
            for await (const chunk of req) { length += chunk.length; if (length > 6_000_000) { res.writeHead(413); res.end("Request is too large"); return; } chunks.push(chunk); }
            const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, ...(chunks.length ? { body: Buffer.concat(chunks) } : {}) });
            const response = await serveEnvelopeVideo(request, { store: aiStore, films, apiKey: process.env.XAI_API_KEY, accessCode: process.env.AI_VIDEO_ACCESS_CODE, openAccess: true,
                allowLocalAccess: ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress) });
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(Buffer.from(await response.arrayBuffer()));
        } catch { res.writeHead(503, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "The envelope film service is unavailable." })); }
        return;
    }
    // a published website: /wedding/<slug> is the static /wedding page, which reads the slug from the address bar
    if (/^\/wedding\/[a-z0-9-]+\/?(?:\?|$)/.test(req.url)) { req.url = "/wedding"; return handle(req, res); }
    if (/^\/api\/website(?:\/|$)/.test(req.url)) {
        try {
            const chunks = []; let length = 0;
            for await (const chunk of req) { length += chunk.length; if (length > 5_500_000) { res.writeHead(413, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "Your photos or music are too large to publish." })); return; } chunks.push(chunk); }
            const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, ...(chunks.length ? { body: Buffer.concat(chunks) } : {}) });
            const response = await serveWebsite(request, siteStore);
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(Buffer.from(await response.arrayBuffer()));
        } catch { res.writeHead(503, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "Could not save or load the website." })); }
        return;
    }
    const translate = /^\/api\/translate(?:\?|$)/.test(req.url);
    if (!ai && !translate && !/^\/(api\/invitation(?:\/|$)|i\/)/.test(req.url)) return handle(req, res);
    try {
        const chunks = []; let length = 0;
        for await (const chunk of req) { length += chunk.length; if (length > (ai ? 4_600_000 : 4_000_000)) { res.writeHead(413); res.end("Upload is too large"); return; } chunks.push(chunk); }
        const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, ...(chunks.length ? { body: Buffer.concat(chunks) } : {}) });
        const response = ai ? await serveAiVideo(request, { store: aiStore, apiKey: process.env.XAI_API_KEY, managementKey: process.env.XAI_MANAGEMENT_API_KEY, teamId: process.env.XAI_TEAM_ID, accessCode: process.env.AI_VIDEO_ACCESS_CODE, allowLocalAccess: ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress) }) : translate ? await serveTranslation(request) : await serveInvitation(request, store);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
    } catch { res.writeHead(503, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "Could not save or load the invitation." })); }
}).listen(port, () => console.log(`Invitation studio: http://localhost:${port}`));
