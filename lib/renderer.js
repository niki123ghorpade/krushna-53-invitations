// One renderer for everything: the printable card, the live animated preview,
// the guest page and the MP4 export all call draw(t).
import { alpha, darken, isLight, lighten, mix } from "./color";
import { H, W, clamp01, easeInOut, easeOut, glow, goldGradient, hangPoints, lotus, progress, rng, roundRect, sparkle } from "./draw-kit";
import { FONT_PAIRS, VIDEO_SECONDS, formatInviteDate, formatInviteTime } from "./invite-design";
import { designOf } from "./designs";
import { artReady, loadArt } from "./painted";
export { W as CANVAS_W, H as CANVAS_H };
/** Timeline (seconds) — shared by the preview, the guest page and the export. */
const T = {
    frame: [1.0, 2.0],
    blessing: [1.8, 1.0],
    monogram: [2.0, 1.2],
    native: [2.2, 1.4],
    photo: [2.0, 1.0],
    host: [2.4, 1.0],
    title: [3.0, 1.6],
    divider: [4.3, 0.8],
    names: [4.8, 1.2],
    date: [6.2, 0.9],
    time: [6.6, 0.9],
    venue: [7.6, 0.9],
    city: [7.9, 0.9],
    message: [9.0, 1.1],
};
export const CHIME_TIMES = [3.0, 4.8, 7.6];
function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
}
export async function ensureFonts(design) {
    if (typeof document === "undefined" || !document.fonts)
        return;
    const paintedArt = design.background.kind === "scene" ? designOf(design).art : undefined;
    if (paintedArt)
        await loadArt(paintedArt);
    const f = FONT_PAIRS[design.fonts] ?? FONT_PAIRS.royal;
    const fontLoads = Promise.all([
        document.fonts.load(`400 80px ${f.script}`),
        document.fonts.load(`${f.capsW} 40px ${f.caps}`),
        document.fonts.load(`${f.serifW} 60px ${f.serif}`),
        f.italic ? document.fonts.load(`italic ${f.serif.includes("Playfair") ? 400 : 500} 40px ${f.serif}`) : Promise.resolve(),
        document.fonts.load("400 80px 'Great Vibes'"),
        // scripts for the blessing line and names in Hindi / Bengali / Punjabi / Urdu
        ...["'Tiro Devanagari Hindi'", "'Amiri'", "500 40px 'Noto Sans Gurmukhi'", "500 40px 'Noto Serif Bengali'"].map((x) => document.fonts.load(x.startsWith("500") ? x : `400 40px ${x}`, "॥ ॐ ੴ বিসমিল্লাহ بسم")),
    ]).catch(() => undefined);
    // Web fonts can stay pending for a long time on a slow or offline connection.
    // Keep client-side gallery thumbnails moving with the browser fallback fonts
    // instead of blocking the serialized thumbnail queue indefinitely.
    await Promise.race([fontLoads, new Promise((resolve) => setTimeout(resolve, 1800))]);
}
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (!src.startsWith("data:") && !src.startsWith("blob:"))
            img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not load image"));
        img.src = src;
    });
}
export class InviteRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.input = null;
        this.sceneCache = null;
        this.artCache = null;
        this.titleCanvas = typeof document !== "undefined" ? makeCanvas(W, 420) : null;
        this.noiseCanvas = null;
        this.grainPattern = null;
        this.foilCanvas = null;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Canvas is not supported in this browser");
        this.ctx = ctx;
    }
    setInput(input) {
        this.input = input;
    }
    // ───────────────── background ─────────────────
    sceneLayer(design) {
        const def = designOf(design);
        const key = `${def.id}|${JSON.stringify(design.palette)}|${def.art ? artReady(def.art) : ""}`;
        if (this.sceneCache?.key !== key) {
            const c = makeCanvas(W, H);
            const cx = c.getContext("2d");
            def.scene.still(cx, design.palette);
            this.sceneCache = { key, canvas: c };
        }
        return this.sceneCache.canvas;
    }
    artLayer(design, art) {
        const key = `${design.tint}|${design.brightness}|${JSON.stringify(design.palette)}`;
        if (this.artCache?.key === key && this.artCache.art === art)
            return this.artCache.canvas;
        const c = makeCanvas(W, H);
        const cx = c.getContext("2d");
        const aw = art.naturalWidth || art.width;
        const ah = art.naturalHeight || art.height;
        const s = Math.max(W / aw, H / ah);
        if (design.brightness !== 1)
            cx.filter = `brightness(${design.brightness})`;
        cx.drawImage(art, (W - aw * s) / 2, (H - ah * s) / 2, aw * s, ah * s);
        cx.filter = "none";
        if (design.tint > 0.01) {
            cx.globalCompositeOperation = "color";
            cx.globalAlpha = design.tint * 0.85;
            const g = cx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, design.palette.sky);
            g.addColorStop(0.6, mix(design.palette.deep, design.palette.flower, 0.25));
            g.addColorStop(1, design.palette.deep);
            cx.fillStyle = g;
            cx.fillRect(0, 0, W, H);
            cx.globalAlpha = 1;
            cx.globalCompositeOperation = "source-over";
        }
        this.artCache = { key, canvas: c, art };
        return c;
    }
    drawBackground(t, still) {
        const { design, art } = this.input;
        const ctx = this.ctx;
        const z = still ? 1 : 1.16 - 0.16 * easeOut(t / 7) + 0.025 * clamp01((t - 7) / 9);
        const py = still ? 0 : (1 - easeOut(t / 7)) * 40;
        ctx.save();
        ctx.translate(W / 2, H * 0.45 + py);
        ctx.scale(z, z);
        ctx.translate(-W / 2, -H * 0.45);
        if (art && design.background.kind === "image") {
            ctx.drawImage(this.artLayer(design, art), 0, 0);
        }
        else {
            if (design.brightness !== 1)
                ctx.filter = `brightness(${design.brightness})`;
            ctx.drawImage(this.sceneLayer(design), 0, 0);
            ctx.filter = "none";
            designOf(design).scene.live(ctx, design.palette, still ? 6.5 : t);
        }
        ctx.restore();
        // gentle vignette
        const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
        v.addColorStop(0, alpha("#000000", 0));
        v.addColorStop(1, alpha("#000000", 0.35));
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, W, H);
    }
    // ───────────────── frames ─────────────────
    drawFrame(t, still) {
        const { design } = this.input;
        if (design.frame === "none")
            return;
        const ctx = this.ctx;
        const p = still ? 1 : easeInOut(progress(t, T.frame[0], T.frame[1]));
        if (p <= 0)
            return;
        const accent = design.palette.accent;
        ctx.save();
        // reveal from the bottom centre upwards
        ctx.beginPath();
        ctx.rect(0, H - H * p - 10, W, H * p + 10);
        ctx.clip();
        ctx.strokeStyle = goldGradient(ctx, 0, 0, W, H, accent);
        ctx.fillStyle = goldGradient(ctx, 0, 0, W, H, accent);
        ctx.shadowColor = alpha("#000000", 0.35);
        ctx.shadowBlur = 8;
        const inset = 44;
        if (design.frame === "arch" || design.frame === "jharokha") {
            for (const [off, lw] of [[0, 5], [18, 2]]) {
                const x0 = inset + off, x1 = W - inset - off, yb = H - inset - off, yTop = 150 + off;
                ctx.lineWidth = lw;
                ctx.beginPath();
                ctx.moveTo(x0, yb);
                ctx.lineTo(x0, 560);
                if (design.frame === "arch") {
                    ctx.bezierCurveTo(x0, 300 + off, 400, 260 + off * 0.5, W / 2, yTop - 40);
                    ctx.bezierCurveTo(W - 400, 260 + off * 0.5, x1, 300 + off, x1, 560);
                }
                else {
                    const cx = W / 2, cy = 560, rx = (x1 - x0) / 2, ry = 560 - yTop;
                    const lobes = 9;
                    for (let i = 0; i < lobes; i++) {
                        const a1 = Math.PI + (i / lobes) * Math.PI, a2 = Math.PI + ((i + 1) / lobes) * Math.PI, am = (a1 + a2) / 2;
                        ctx.quadraticCurveTo(cx + Math.cos(am) * rx * 1.12, cy + Math.sin(am) * ry * 1.12, cx + Math.cos(a2) * rx, cy + Math.sin(a2) * ry);
                    }
                }
                ctx.lineTo(x1, yb);
                ctx.closePath();
                ctx.stroke();
            }
            lotus(ctx, W / 2, 132, 34, accent);
        }
        else if (design.frame === "double-border") {
            ctx.lineWidth = 5;
            ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
            ctx.lineWidth = 2;
            ctx.strokeRect(inset + 18, inset + 18, W - (inset + 18) * 2, H - (inset + 18) * 2);
            for (const [x, y] of [[inset + 9, inset + 9], [W - inset - 9, inset + 9], [inset + 9, H - inset - 9], [W - inset - 9, H - inset - 9]]) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-16, -16, 32, 32);
                ctx.restore();
            }
            lotus(ctx, W / 2, inset + 4, 30, accent);
            lotus(ctx, W / 2, H - inset - 34, 30, accent);
        }
        else if (design.frame === "toran") {
            // Delicate toran: a fine gold swag across the top with small leaf drops
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1.6;
            ctx.strokeRect(inset + 10, inset + 10, W - (inset + 10) * 2, H - (inset + 10) * 2);
            const pts = hangPoints(inset + 24, inset + 34, W - inset - 24, inset + 34, 34, 28);
            ctx.lineWidth = 2;
            ctx.beginPath();
            pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
            ctx.stroke();
            pts.forEach((q, i) => {
                if (i === 0 || i === pts.length - 1)
                    return;
                if (i % 2) {
                    ctx.beginPath();
                    ctx.ellipse(q.x, q.y + 14, 4.5, 11, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                else {
                    ctx.beginPath();
                    ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            // short tasselled strands at both ends
            for (const x of [inset + 24, W - inset - 24]) {
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(x, inset + 34);
                ctx.lineTo(x, inset + 150);
                ctx.stroke();
                for (let k = 0; k < 4; k++) {
                    ctx.beginPath();
                    ctx.arc(x, inset + 58 + k * 24, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.ellipse(x, inset + 162, 4, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            lotus(ctx, W / 2, H - inset - 30, 22, accent);
        }
        else if (design.frame === "mandap") {
            // Fine-line mandap: slim pillars, a low canopy and a small kalash
            ctx.shadowBlur = 0;
            const pl = inset + 30, pr = W - inset - 30, beam = 300, base = H - inset - 10;
            ctx.lineWidth = 1.6;
            ctx.strokeRect(inset + 10, inset + 10, W - (inset + 10) * 2, H - (inset + 10) * 2);
            for (const x of [pl, pr]) {
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(x - 7, beam + 14);
                ctx.lineTo(x - 7, base - 20);
                ctx.moveTo(x + 7, beam + 14);
                ctx.lineTo(x + 7, base - 20);
                ctx.stroke();
                ctx.strokeRect(x - 13, beam + 2, 26, 12);
                ctx.strokeRect(x - 13, base - 20, 26, 12);
                for (let y = beam + 120; y < base - 80; y += 260) {
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pl - 16, beam);
            ctx.lineTo(pr + 16, beam);
            ctx.moveTo(pl - 16, beam);
            ctx.lineTo(W / 2, beam - 64);
            ctx.lineTo(pr + 16, beam);
            ctx.stroke();
            // fine scallops under the canopy
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            const sc = 18, sw = (pr - pl) / sc;
            for (let i = 0; i < sc; i++) {
                ctx.moveTo(pl + sw * i + sw, beam + 2);
                ctx.arc(pl + sw * (i + 0.5), beam + 2, sw / 2, 0, Math.PI);
            }
            ctx.stroke();
            // small kalash at the apex
            const kx = W / 2, ky = beam - 82;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(kx, ky, 12, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(kx - 7, ky - 10);
            ctx.lineTo(kx + 7, ky - 10);
            ctx.stroke();
            for (const ang of [-0.7, 0, 0.7]) {
                ctx.save();
                ctx.translate(kx, ky - 12);
                ctx.rotate(ang);
                ctx.beginPath();
                ctx.ellipse(0, -9, 3, 9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            // one light swag of gold beads
            hangPoints(pl, beam + 24, pr, beam + 24, 46, 26).forEach((q, i, arr) => {
                if (i === 0 || i === arr.length - 1)
                    return;
                ctx.beginPath();
                ctx.arc(q.x, q.y, i % 2 ? 2.5 : 3.5, 0, Math.PI * 2);
                ctx.fill();
            });
            lotus(ctx, W / 2, H - inset - 30, 22, accent);
        }
        else if (design.frame === "floral-corners") {
            ctx.lineWidth = 2.5;
            ctx.strokeRect(inset + 10, inset + 10, W - (inset + 10) * 2, H - (inset + 10) * 2);
            const corner = () => {
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(0, 230);
                ctx.bezierCurveTo(0, 90, 90, 0, 230, 0);
                ctx.stroke();
                ctx.lineWidth = 2.5;
                for (const [sx, sy, r] of [[70, 70, 34], [150, 36, 18], [36, 150, 18]]) {
                    ctx.beginPath();
                    for (let a = 0; a < Math.PI * 3.2; a += 0.15) {
                        const rr = r * (1 - a / (Math.PI * 3.6));
                        const px = sx + Math.cos(a) * rr, py = sy + Math.sin(a) * rr;
                        if (a === 0)
                            ctx.moveTo(px, py);
                        else
                            ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                }
                for (let i = 0; i < 6; i++) {
                    const u = 0.15 + i * 0.14;
                    const x = 230 * Math.pow(u, 1.3), y = 230 * Math.pow(1 - u, 1.3);
                    ctx.save();
                    ctx.translate(x + 20, y + 20);
                    ctx.rotate(-Math.PI / 4 + (i % 2 ? 0.6 : -0.6));
                    ctx.beginPath();
                    ctx.ellipse(18, 0, 18, 6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            };
            for (const [x, y, sx, sy] of [[inset, inset, 1, 1], [W - inset, inset, -1, 1], [inset, H - inset, 1, -1], [W - inset, H - inset, -1, -1]]) {
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(sx, sy);
                corner();
                ctx.restore();
            }
        }
        ctx.restore();
        if (!still && p > 0 && p < 1)
            sparkle(ctx, W / 2 + Math.sin(p * 9) * 420, H - H * p, 26, "#fffbe8", 1);
    }
    // ───────────────── text ─────────────────
    font(kind, size) {
        const f = FONT_PAIRS[this.input.design.fonts] ?? FONT_PAIRS.royal;
        switch (kind) {
            case "caps": return `${f.capsW} ${size}px ${f.caps}`;
            case "script":
            case "weds": return `400 ${size}px ${f.script}`;
            case "italic": return f.italic ? `italic ${f.serif.includes("Playfair") ? 400 : 500} ${size}px ${f.serif}` : `${f.serifW} ${size * 0.92}px ${f.serif}`;
            default: return `${f.serifW} ${size}px ${f.serif}`;
        }
    }
    spacedWidth(text, spacing) {
        return this.ctx.measureText(text).width + spacing * Math.max(0, text.length - 1);
    }
    wrap(text, maxW, spacing = 0, maxLines = 3) {
        const words = text.split(/\s+/).filter(Boolean);
        const lines = [];
        let cur = "";
        for (const w of words) {
            const next = cur ? `${cur} ${w}` : w;
            if (this.spacedWidth(next, spacing) > maxW && cur) {
                lines.push(cur);
                cur = w;
            }
            else
                cur = next;
        }
        if (cur)
            lines.push(cur);
        if (lines.length > maxLines) {
            const kept = lines.slice(0, maxLines);
            kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, "") + "…";
            return kept;
        }
        return lines;
    }
    fit(kind, text, size, min, maxW, spacing = 0) {
        let s = size;
        this.ctx.font = this.font(kind, s);
        while (s > min && this.spacedWidth(text, spacing * (s / size)) > maxW) {
            s -= 2;
            this.ctx.font = this.font(kind, s);
        }
        return s;
    }
    /** Pick a font that can show the blessing line's script. */
    scriptFont(text) {
        if (/[\u0600-\u06FF]/.test(text))
            return "400 {s}px 'Amiri'";
        if (/[\u0A00-\u0A7F]/.test(text))
            return "500 {s}px 'Noto Sans Gurmukhi'";
        if (/[\u0980-\u09FF]/.test(text))
            return "500 {s}px 'Noto Serif Bengali'";
        if (/[\u0900-\u097F]/.test(text))
            return "400 {s}px 'Tiro Devanagari Hindi'";
        return null;
    }
    layout(scale) {
        const { design, details, photo } = this.input;
        const ctx = this.ctx;
        const maxW = 700;
        const comp = design.composition ?? "classic";
        const mono = comp === "monogram" || comp === "grand";
        const weds = comp === "weds" || comp === "grand";
        const dblock = comp === "dateblock";
        const lines = [];
        const blessing = design.blessing ? details.blessing?.trim() : "";
        if (blessing) {
            const native = !!this.scriptFont(blessing);
            const size = (native ? 38 : 24) * scale;
            lines.push({ key: "blessing", kind: "blessing", size, text: blessing, height: size * (native ? 1.9 : 2.1) });
        }
        const native = details.nativeNames?.trim();
        if (native) {
            const tmpl = this.scriptFont(native) ?? "400 {s}px 'Tiro Devanagari Hindi'";
            let size = 104 * scale;
            ctx.font = tmpl.replace("{s}", String(size));
            while (size > 40 && ctx.measureText(native).width > 860) {
                size -= 4;
                ctx.font = tmpl.replace("{s}", String(size));
            }
            lines.push({ key: "native", kind: "native", size, text: native, height: size * 1.55 });
        }
        if (photo && design.showPhoto)
            lines.push({ key: "photo", kind: "photo", size: 1, height: 330 * scale + 34 * scale });
        else if (mono)
            lines.push({ key: "monogram", kind: "monogram", size: scale, height: 236 * scale });
        if (details.hostLine.trim()) {
            const size = 28 * scale;
            ctx.font = this.font("caps", size);
            const l = this.wrap(details.hostLine.toUpperCase(), 620, 5 * scale, 2);
            lines.push({ key: "host", kind: "caps", size, spacing: 5 * scale, lines: l, height: l.length * size * 1.5 + 8 * scale });
        }
        if (weds) {
            const longer = (details.brideName || "Bride").length >= (details.groomName || "Groom").length ? details.brideName || "Bride" : details.groomName || "Groom";
            const size = this.fit("weds", longer, 150 * scale, 84 * scale, maxW);
            lines.push({ key: "names", kind: "weds", size, lines: [details.brideName || "Bride", details.groomName || "Groom"], height: size * 2.05 + 70 * scale });
            lines.push({ key: "divider", kind: "divider", size: 1, height: 56 * scale });
            if (details.title.trim()) {
                const t = details.title.toUpperCase();
                const ts = this.fit("caps", t, 34 * scale, 22 * scale, maxW, 8 * scale);
                lines.push({ key: "title", kind: "caps", size: ts, spacing: 8 * scale, lines: [t], height: ts * 1.9 });
            }
        }
        else {
            if (details.title.trim()) {
                const size = this.fit("script", details.title, 168 * scale, 96 * scale, maxW + 20);
                ctx.font = this.font("script", size);
                const l = ctx.measureText(details.title).width > maxW + 20 ? this.wrap(details.title, maxW + 20, 0, 2) : [details.title];
                lines.push({ key: "title", kind: "script", size, lines: l, height: l.length * size * 1.08 + 4 * scale });
            }
            lines.push({ key: "divider", kind: "divider", size: 1, height: 56 * scale });
            const names = `${details.brideName || "Bride"} & ${details.groomName || "Groom"}`;
            const size = this.fit("names", names, 92 * scale, 56 * scale, maxW);
            const stacked = size < 70 * scale;
            const s2 = stacked ? Math.min(84 * scale, this.fit("names", details.brideName.length > details.groomName.length ? details.brideName : details.groomName, 84 * scale, 48 * scale, maxW)) : size;
            lines.push({ key: "names", kind: "names", size: s2, text: names, lines: stacked ? [details.brideName, "&", details.groomName] : [names], height: (stacked ? 3 : 1) * s2 * 1.18 + 26 * scale });
        }
        if (dblock) {
            lines.push({ key: "date", kind: "dateblock", size: scale, height: 250 * scale });
        }
        else {
            const date = formatInviteDate(details.date).toUpperCase();
            const dsize = this.fit("caps", date, 34 * scale, 22 * scale, maxW, 4 * scale);
            lines.push({ key: "date", kind: "caps", size: dsize, spacing: 4 * scale, lines: [date], height: dsize * 1.6 });
            const time = formatInviteTime(details.time);
            if (time)
                lines.push({ key: "time", kind: "italic", size: 40 * scale, lines: [time], height: 40 * scale * 1.5 + 18 * scale });
        }
        if (details.venue.trim()) {
            const vs = this.fit("serif", details.venue, 54 * scale, 34 * scale, maxW);
            lines.push({ key: "venue", kind: "serif", size: vs, lines: [details.venue], height: vs * 1.3 });
        }
        if (details.city.trim()) {
            const city = details.city.toUpperCase();
            const cs = this.fit("caps", city, 26 * scale, 18 * scale, maxW, 5 * scale);
            lines.push({ key: "city", kind: "caps", size: cs, spacing: 5 * scale, lines: [city], height: cs * 1.6 + 20 * scale });
        }
        if (details.message.trim()) {
            const size = 34 * scale;
            ctx.font = this.font("italic", size);
            const l = this.wrap(details.message, 640, 0, 3);
            lines.push({ key: "message", kind: "italic", size, lines: l, height: l.length * size * 1.35 });
        }
        return lines;
    }
    region() {
        const { design } = this.input;
        if (design.layout === "top")
            return [230, 1320];
        if (design.layout === "bottom")
            return [820, 1740];
        if (design.background.kind === "scene") {
            const r = designOf(design).region;
            if (r)
                return r;
        }
        return [560, 1620];
    }
    drawText(t, still) {
        const { design, details, photo } = this.input;
        const ctx = this.ctx;
        const pal = design.palette;
        const [top, bottom] = this.region();
        const avail = bottom - top;
        let scale = 1;
        let lines = this.layout(scale);
        let total = lines.reduce((s, l) => s + l.height, 0);
        if (total > avail) {
            scale = Math.max(0.6, avail / total);
            lines = this.layout(scale);
            total = lines.reduce((s, l) => s + l.height, 0);
        }
        let y = top + Math.max(0, (avail - total) / 2);
        const blockTop = y;
        const scroll = design.backdrop === "scroll";
        const paperCard = design.backdrop === "paper";
        const textColor = (scroll || paperCard) && isLight(pal.text) ? darken(mix(pal.accent, pal.deep, 0.4), 0.6) : pal.text;
        const light = isLight(textColor);
        const fade = still ? 1 : easeOut(progress(t, 1.6, 1.6));
        // readability backdrop
        if (design.backdrop !== "none" && fade > 0) {
            ctx.save();
            ctx.globalAlpha = fade;
            const pad = 54;
            if (design.backdrop === "glow") {
                const cy = blockTop + total / 2;
                ctx.translate(W / 2, cy);
                ctx.scale(1, (total / 2 + 220) / 560);
                const g = ctx.createRadialGradient(0, 0, 40, 0, 0, 560);
                const c = light ? darken(pal.deep, 0.55) : lighten(pal.sky, 0.75);
                g.addColorStop(0, alpha(c, light ? 0.62 : 0.78));
                g.addColorStop(0.6, alpha(c, light ? 0.42 : 0.5));
                g.addColorStop(1, alpha(c, 0));
                ctx.fillStyle = g;
                ctx.fillRect(-560, -560, 1120, 1120);
            }
            else if (design.backdrop === "glass") {
                roundRect(ctx, 120, blockTop - pad, W - 240, total + pad * 2, 36);
                ctx.fillStyle = light ? alpha(darken(pal.deep, 0.5), 0.55) : alpha(lighten(pal.sky, 0.8), 0.72);
                ctx.fill();
                ctx.strokeStyle = alpha(pal.accent, 0.9);
                ctx.lineWidth = 2.5;
                ctx.stroke();
                roundRect(ctx, 134, blockTop - pad + 14, W - 268, total + pad * 2 - 28, 28);
                ctx.strokeStyle = alpha(pal.accent, 0.45);
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            else if (scroll) {
                const x = 130, w = W - 260, yy = blockTop - pad, hh = total + pad * 2;
                const paper = mix("#fbf1dc", pal.sky, 0.06);
                const g = ctx.createLinearGradient(x, 0, x + w, 0);
                g.addColorStop(0, darken(paper, 0.08));
                g.addColorStop(0.5, paper);
                g.addColorStop(1, darken(paper, 0.08));
                ctx.shadowColor = alpha("#000000", 0.35);
                ctx.shadowBlur = 30;
                ctx.fillStyle = g;
                ctx.fillRect(x, yy, w, hh);
                ctx.shadowBlur = 0;
                for (const ry of [yy - 18, yy + hh - 18]) {
                    const rg = ctx.createLinearGradient(0, ry, 0, ry + 36);
                    rg.addColorStop(0, darken(paper, 0.25));
                    rg.addColorStop(0.5, lighten(paper, 0.3));
                    rg.addColorStop(1, darken(paper, 0.35));
                    ctx.fillStyle = rg;
                    roundRect(ctx, x - 30, ry, w + 60, 36, 18);
                    ctx.fill();
                    ctx.fillStyle = goldGradient(ctx, 0, 0, 40, 0, pal.accent);
                    for (const ex of [x - 46, x + w + 26]) {
                        roundRect(ctx, ex, ry + 6, 20, 24, 6);
                        ctx.fill();
                    }
                }
                ctx.strokeStyle = alpha(pal.accent, 0.6);
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 22, yy + 30, w - 44, hh - 60);
            }
            else if (paperCard) {
                const x = 96, w = W - 192, yy = blockTop - pad - 24, hh = total + pad * 2 + 48;
                const paper = mix("#fffaf1", pal.sky, 0.08);
                const g = ctx.createLinearGradient(0, yy, 0, yy + hh);
                g.addColorStop(0, lighten(paper, 0.3));
                g.addColorStop(1, darken(paper, 0.05));
                ctx.shadowColor = alpha("#000000", 0.4);
                ctx.shadowBlur = 40;
                ctx.shadowOffsetY = 14;
                roundRect(ctx, x, yy, w, hh, 10);
                ctx.fillStyle = g;
                ctx.fill();
                ctx.shadowColor = "transparent";
                ctx.save();
                roundRect(ctx, x, yy, w, hh, 10);
                ctx.clip();
                ctx.globalAlpha *= 0.7;
                ctx.globalCompositeOperation = "soft-light";
                ctx.fillStyle = this.grain();
                ctx.fillRect(x, yy, w, hh);
                ctx.restore();
                const gold = goldGradient(ctx, x, 0, x + w, 0, pal.accent);
                ctx.strokeStyle = gold;
                ctx.lineWidth = 3;
                ctx.strokeRect(x + 18, yy + 18, w - 36, hh - 36);
                ctx.lineWidth = 1.2;
                ctx.strokeRect(x + 28, yy + 28, w - 56, hh - 56);
                for (const [cx, cy, sx, sy] of [[x + 18, yy + 18, 1, 1], [x + w - 18, yy + 18, -1, 1], [x + 18, yy + hh - 18, 1, -1], [x + w - 18, yy + hh - 18, -1, -1]]) {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.scale(sx, sy);
                    ctx.fillStyle = gold;
                    ctx.strokeStyle = gold;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, 9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(14, 4);
                    ctx.bezierCurveTo(40, 4, 46, 26, 30, 30);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(4, 14);
                    ctx.bezierCurveTo(4, 40, 26, 46, 30, 30);
                    ctx.stroke();
                    ctx.restore();
                }
                lotus(ctx, W / 2, yy + 34, 18, pal.accent);
            }
            ctx.restore();
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const shadow = () => {
            if (design.backdrop === "scroll" || design.backdrop === "glass" || design.backdrop === "paper") {
                ctx.shadowBlur = 0;
                return;
            }
            ctx.shadowColor = light ? alpha("#000000", 0.6) : alpha(lighten(pal.sky, 0.85), 0.9);
            ctx.shadowBlur = 18;
        };
        for (const line of lines) {
            const [start, dur] = T[line.key];
            const p = still ? 1 : easeOut(progress(t, start, dur));
            if (p > 0) {
                ctx.save();
                ctx.globalAlpha = p;
                const rise = (1 - p) * 34;
                shadow();
                if (line.kind === "blessing")
                    this.drawBlessing(line, y + rise, light);
                else if (line.kind === "native") {
                    const tm = this.scriptFont(line.text ?? "") ?? "400 {s}px 'Tiro Devanagari Hindi'";
                    ctx.shadowBlur = 0;
                    this.foil(line.text ?? "", W / 2, y + rise + line.size * 1.08, tm.replace("{s}", String(line.size)), light, { wipe: still ? 1 : p });
                }
                else if (line.kind === "monogram")
                    this.drawMonogram(y, line.size, light, p);
                else if (line.kind === "weds")
                    this.drawWeds(line, y + rise, light, t, still);
                else if (line.kind === "dateblock")
                    this.drawDateBlock(y + rise, line.size, textColor, light);
                else if (line.kind === "photo" && photo)
                    this.drawPhoto(photo, y, line.height - 34 * scale, scale);
                else if (line.kind === "divider")
                    this.drawDivider(y + line.height / 2, p, scale);
                else if (line.kind === "script")
                    this.drawTitle(line, y, t, still, light);
                else if (line.key === "names")
                    this.drawNames(line, y + rise, textColor);
                else {
                    ctx.font = this.font(line.kind, line.size);
                    ctx.fillStyle = line.key === "date" || line.key === "city" || line.key === "title" ? (light ? lighten(pal.accent, 0.35) : darken(pal.accent, 0.1)) : textColor;
                    (line.lines ?? []).forEach((txt, i) => {
                        const ly = y + rise + line.size * (line.kind === "caps" ? 1.15 : 1.05) + i * line.size * (line.kind === "caps" ? 1.5 : 1.35);
                        if (line.spacing)
                            this.spacedText(txt, W / 2, ly, line.spacing);
                        else
                            ctx.fillText(txt, W / 2, ly);
                    });
                }
                ctx.restore();
            }
            y += line.height;
        }
        void details;
    }
    spacedText(text, cx, y, spacing) {
        const ctx = this.ctx;
        const total = this.spacedWidth(text, spacing);
        let x = cx - total / 2;
        ctx.textAlign = "left";
        for (const ch of text) {
            ctx.fillText(ch, x, y);
            x += ctx.measureText(ch).width + spacing;
        }
        ctx.textAlign = "center";
    }
    /** Fine paper grain (used for the whole card and for metallic foil). */
    noise() {
        if (!this.noiseCanvas) {
            const c = makeCanvas(180, 180);
            const cx = c.getContext("2d");
            const img = cx.createImageData(180, 180);
            const r = rng(77);
            for (let i = 0; i < img.data.length; i += 4) {
                const v = 96 + r() * 64;
                img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
                img.data[i + 3] = 255;
            }
            cx.putImageData(img, 0, 0);
            this.noiseCanvas = c;
        }
        return this.noiseCanvas;
    }
    grain() {
        if (!this.grainPattern)
            this.grainPattern = this.ctx.createPattern(this.noise(), "repeat");
        return this.grainPattern;
    }
    /** Metallic gold-foil lettering with grain, satin sheen and a soft drop shadow. */
    foil(text, cx, baseline, font, light, opts = {}) {
        const ctx = this.ctx;
        const accent = opts.color ?? this.input.design.palette.accent;
        ctx.font = font;
        const prevAlign = ctx.textAlign;
        ctx.textAlign = "left";
        const m = ctx.measureText(text);
        ctx.textAlign = prevAlign;
        const left = m.actualBoundingBoxLeft, right = m.actualBoundingBoxRight;
        const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
        const pad = 24;
        const bw = Math.ceil(left + right + pad * 2), bh = Math.ceil(asc + desc + pad * 2);
        if (!this.foilCanvas)
            this.foilCanvas = makeCanvas(W + 200, 600);
        const oc = this.foilCanvas;
        if (oc.width < bw)
            oc.width = bw;
        if (oc.height < bh)
            oc.height = bh;
        const ox = oc.getContext("2d");
        ox.clearRect(0, 0, bw + 2, bh + 2);
        ox.font = font;
        ox.textAlign = "left";
        ox.textBaseline = "alphabetic";
        const g = ox.createLinearGradient(0, pad, 0, pad + asc + desc);
        if (light) {
            g.addColorStop(0, lighten(accent, 0.6));
            g.addColorStop(0.3, lighten(accent, 0.15));
            g.addColorStop(0.5, darken(accent, 0.12));
            g.addColorStop(0.62, lighten(accent, 0.45));
            g.addColorStop(1, darken(accent, 0.2));
        }
        else {
            g.addColorStop(0, lighten(accent, 0.2));
            g.addColorStop(0.35, darken(accent, 0.05));
            g.addColorStop(0.55, darken(accent, 0.3));
            g.addColorStop(0.7, lighten(accent, 0.1));
            g.addColorStop(1, darken(accent, 0.35));
        }
        ox.fillStyle = g;
        ox.fillText(text, pad + left, pad + asc);
        ox.globalCompositeOperation = "source-atop";
        ox.globalAlpha = 0.22;
        ox.fillStyle = ox.createPattern(this.noise(), "repeat");
        ox.fillRect(0, 0, bw, bh);
        ox.globalAlpha = 1;
        const sheen = ox.createLinearGradient(0, pad, 0, pad + asc + desc);
        sheen.addColorStop(0, alpha("#ffffff", 0));
        sheen.addColorStop(0.22, alpha("#ffffff", 0.32));
        sheen.addColorStop(0.36, alpha("#ffffff", 0));
        sheen.addColorStop(1, alpha("#ffffff", 0));
        ox.fillStyle = sheen;
        ox.fillRect(0, 0, bw, bh);
        if (opts.shimmer !== undefined && opts.shimmer >= 0 && opts.shimmer <= 1) {
            const sx = -150 + opts.shimmer * (bw + 300);
            const sg = ox.createLinearGradient(sx - 110, 0, sx + 110, bh);
            sg.addColorStop(0, alpha("#ffffff", 0));
            sg.addColorStop(0.5, alpha("#ffffff", 0.9));
            sg.addColorStop(1, alpha("#ffffff", 0));
            ox.fillStyle = sg;
            ox.fillRect(0, 0, bw, bh);
        }
        ox.globalCompositeOperation = "source-over";
        const dx = cx - (right - left) / 2 - left - pad;
        const dy = baseline - asc - pad;
        ctx.save();
        if (opts.wipe !== undefined && opts.wipe < 1) {
            ctx.beginPath();
            ctx.rect(dx, dy - 20, bw * opts.wipe, bh + 40);
            ctx.clip();
        }
        ctx.shadowColor = light ? alpha("#000000", 0.55) : alpha("#5a3a14", 0.28);
        ctx.shadowBlur = light ? 14 : 6;
        ctx.shadowOffsetY = light ? 4 : 2;
        ctx.drawImage(oc, 0, 0, bw, bh, dx, dy, bw, bh);
        ctx.restore();
        return { x: dx, w: bw };
    }
    drawTitle(line, y, t, still, lightText) {
        const ctx = this.ctx;
        const lh = line.size * 1.08;
        const shimmerAt = [5.0, 11.5, 14.2].find((s) => t >= s && t < s + 1.2);
        const shimmer = !still && shimmerAt !== undefined ? (t - shimmerAt) / 1.2 : undefined;
        const [start, dur] = T.title;
        const p = still ? 1 : easeInOut(progress(t, start, dur));
        let edge = 0;
        (line.lines ?? []).forEach((txt, i) => {
            const r = this.foil(txt, W / 2, y + line.size * 0.8 + i * lh, this.font("script", line.size), lightText, { wipe: p, shimmer });
            edge = r.x + r.w * p;
        });
        if (!still && p > 0 && p < 1)
            sparkle(ctx, edge, y + line.size * 0.6, 30, "#fffbe8", 1);
    }
    drawBlessing(line, y, light) {
        const ctx = this.ctx;
        const pal = this.input.design.palette;
        const text = line.text ?? "";
        const tmpl = this.scriptFont(text);
        ctx.fillStyle = light ? lighten(pal.accent, 0.35) : darken(pal.accent, 0.2);
        if (tmpl) {
            ctx.font = tmpl.replace("{s}", String(line.size));
            ctx.direction = /[\u0600-\u06FF]/.test(text) ? "rtl" : "ltr";
            ctx.fillText(text, W / 2, y + line.size * 1.15);
            ctx.direction = "ltr";
        }
        else {
            ctx.font = this.font("caps", line.size);
            this.spacedText(text.toUpperCase(), W / 2, y + line.size * 1.3, 6 * (line.size / 24));
        }
    }
    drawMonogram(y, scale, light, p) {
        const ctx = this.ctx;
        const { design, details } = this.input;
        const pal = design.palette;
        const cx = W / 2, cy = y + 112 * scale, r = 92 * scale;
        const gold = goldGradient(ctx, cx - r, cy - r, cx + r, cy + r, pal.accent);
        ctx.save();
        ctx.shadowColor = "transparent";
        // laurel wreath
        for (const side of [-1, 1]) {
            for (let i = 0; i < 9; i++) {
                const a = Math.PI / 2 + side * (0.35 + i * 0.27) * p;
                const lx = cx + Math.cos(a) * (r + 18 * scale), ly = cy + Math.sin(a) * (r + 18 * scale);
                ctx.save();
                ctx.translate(lx, ly);
                ctx.rotate(a + side * 1.1);
                ctx.fillStyle = i % 2 ? pal.accent : lighten(pal.accent, 0.25);
                ctx.beginPath();
                ctx.ellipse(0, 0, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.fillStyle = light ? alpha(darken(pal.deep, 0.4), 0.45) : alpha(lighten(pal.sky, 0.7), 0.7);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = gold;
        ctx.lineWidth = 4 * scale;
        ctx.stroke();
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 10 * scale, 0, Math.PI * 2);
        ctx.stroke();
        lotus(ctx, cx, cy - r - 4 * scale, 22 * scale, pal.accent);
        ctx.restore();
        const a = (details.brideName || "A").trim()[0]?.toUpperCase() ?? "A";
        const b = (details.groomName || "R").trim()[0]?.toUpperCase() ?? "R";
        const font = `400 ${96 * scale}px ${FONT_PAIRS[design.fonts]?.script ?? "'Great Vibes'"}`;
        this.foil(a, cx - 34 * scale, cy + 30 * scale, font, light);
        this.foil(b, cx + 36 * scale, cy + 30 * scale, font, light);
        ctx.strokeStyle = gold;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 46 * scale);
        ctx.lineTo(cx, cy + 46 * scale);
        ctx.stroke();
    }
    drawWeds(line, y, light, t, still) {
        const ctx = this.ctx;
        const pal = this.input.design.palette;
        const s = line.size;
        const [a, b] = line.lines ?? ["", ""];
        const shimmerAt = [6.4, 12.4].find((x) => t >= x && t < x + 1.2);
        const shimmer = !still && shimmerAt !== undefined ? (t - shimmerAt) / 1.2 : undefined;
        this.foil(a, W / 2, y + s * 0.85, this.font("weds", s), light, { shimmer });
        const wy = y + s * 1.02 + 34 * (s / 140);
        ctx.save();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = goldGradient(ctx, W / 2 - 200, 0, W / 2 + 200, 0, pal.accent);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 190, wy - 9);
        ctx.lineTo(W / 2 - 70, wy - 9);
        ctx.moveTo(W / 2 + 70, wy - 9);
        ctx.lineTo(W / 2 + 190, wy - 9);
        ctx.stroke();
        ctx.fillStyle = light ? lighten(pal.accent, 0.35) : darken(pal.accent, 0.15);
        ctx.font = this.font("caps", 28 * (s / 140));
        this.spacedText("WEDS", W / 2, wy, 10 * (s / 140));
        ctx.restore();
        this.foil(b, W / 2, y + s * 1.95 + 64 * (s / 140), this.font("weds", s), light, { shimmer });
    }
    drawDateBlock(y, scale, textColor, light) {
        const ctx = this.ctx;
        const { design, details } = this.input;
        const pal = design.palette;
        const d = new Date((details.date || "") + "T12:00:00");
        const acc = light ? lighten(pal.accent, 0.35) : darken(pal.accent, 0.15);
        const cy = y + 96 * scale;
        if (Number.isNaN(d.getTime())) {
            ctx.fillStyle = textColor;
            ctx.font = this.font("caps", 30 * scale);
            ctx.fillText(formatInviteDate(details.date).toUpperCase(), W / 2, cy);
            return;
        }
        const weekday = d.toLocaleDateString("en-IN", { weekday: "long" }).toUpperCase();
        const month = d.toLocaleDateString("en-IN", { month: "long" }).toUpperCase();
        ctx.save();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = goldGradient(ctx, W / 2 - 300, 0, W / 2 + 300, 0, pal.accent);
        ctx.lineWidth = 2;
        for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(W / 2 + sx * 108 * scale, cy - 92 * scale);
            ctx.lineTo(W / 2 + sx * 108 * scale, cy + 40 * scale);
            ctx.stroke();
            const colX = W / 2 + sx * 230 * scale;
            ctx.beginPath();
            ctx.moveTo(colX - 100 * scale, cy - 52 * scale);
            ctx.lineTo(colX + 100 * scale, cy - 52 * scale);
            ctx.moveTo(colX - 100 * scale, cy + 6 * scale);
            ctx.lineTo(colX + 100 * scale, cy + 6 * scale);
            ctx.stroke();
            ctx.fillStyle = acc;
            const txt = sx < 0 ? weekday : month;
            let fs = 30 * scale;
            ctx.font = this.font("caps", fs);
            while (this.spacedWidth(txt, 4 * scale) > 196 * scale && fs > 16) {
                fs -= 1;
                ctx.font = this.font("caps", fs);
            }
            this.spacedText(txt, colX, cy - 12 * scale, 4 * scale);
        }
        ctx.restore();
        this.foil(String(d.getDate()).padStart(2, "0"), W / 2, cy + 22 * scale, this.font("serif", 140 * scale), light);
        const time = formatInviteTime(details.time);
        ctx.fillStyle = textColor;
        ctx.font = this.font("italic", 38 * scale);
        ctx.fillText([String(d.getFullYear()), time].filter(Boolean).join("  ·  "), W / 2, cy + 104 * scale);
    }
    drawNames(line, y, color) {
        const { design, details } = this.input;
        const ctx = this.ctx;
        const f = FONT_PAIRS[design.fonts];
        const s = line.size;
        const ampSize = s * 1.05;
        const amp = design.palette.accent;
        const lh = s * 1.18;
        if ((line.lines?.length ?? 1) === 3) {
            [details.brideName, "&", details.groomName].forEach((txt, i) => {
                const yy = y + s + i * lh;
                if (i === 1) {
                    ctx.font = `400 ${ampSize}px 'Great Vibes'`;
                    ctx.fillStyle = amp;
                }
                else {
                    ctx.font = this.font("names", s);
                    ctx.fillStyle = color;
                }
                ctx.fillText(txt, W / 2, yy);
            });
            return;
        }
        const a = details.brideName || "Bride", b = details.groomName || "Groom";
        ctx.font = this.font("names", s);
        const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
        ctx.font = `400 ${ampSize}px 'Great Vibes'`;
        const wAmp = ctx.measureText("&").width + s * 0.5;
        const total = wa + wAmp + wb;
        let x = W / 2 - total / 2;
        const yy = y + s;
        ctx.textAlign = "left";
        ctx.font = this.font("names", s);
        ctx.fillStyle = color;
        ctx.fillText(a, x, yy);
        x += wa + s * 0.25;
        ctx.font = `400 ${ampSize}px 'Great Vibes'`;
        ctx.fillStyle = amp;
        ctx.fillText("&", x, yy + s * 0.04);
        x += wAmp - s * 0.25;
        ctx.font = this.font("names", s);
        ctx.fillStyle = color;
        ctx.fillText(b, x, yy);
        ctx.textAlign = "center";
    }
    drawDivider(y, p, scale) {
        const ctx = this.ctx;
        const accent = this.input.design.palette.accent;
        const half = 230 * scale * p;
        const gold = goldGradient(ctx, W / 2 - half, 0, W / 2 + half, 0, accent);
        ctx.save();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = gold;
        ctx.fillStyle = gold;
        ctx.lineCap = "round";
        for (const s of [-1, 1]) {
            ctx.lineWidth = 2.2 * scale;
            ctx.beginPath();
            ctx.moveTo(W / 2 + s * 34 * scale, y);
            ctx.bezierCurveTo(W / 2 + s * half * 0.35, y - 16 * scale, W / 2 + s * half * 0.7, y + 14 * scale, W / 2 + s * half, y);
            ctx.stroke();
            // curl
            ctx.lineWidth = 1.8 * scale;
            ctx.beginPath();
            const cx = W / 2 + s * 70 * scale;
            for (let a = 0; a < Math.PI * 1.7; a += 0.12) {
                const r = 14 * scale * (1 - a / (Math.PI * 2.2));
                const px = cx + s * Math.cos(a + Math.PI / 2) * r, py = y - 12 * scale + Math.sin(a + Math.PI / 2) * r;
                if (a === 0)
                    ctx.moveTo(px, py);
                else
                    ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(W / 2 + s * (half + 8 * scale), y, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(W / 2 + s * (half * 0.55), y - 2 * scale, 2.6 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.save();
        ctx.translate(W / 2, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-9 * scale, -9 * scale, 18 * scale, 18 * scale);
        ctx.restore();
        ctx.fillStyle = lighten(accent, 0.5);
        ctx.beginPath();
        ctx.arc(W / 2, y, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    drawPhoto(photo, y, h, scale) {
        const ctx = this.ctx;
        const accent = this.input.design.palette.accent;
        const w = h * 0.8;
        const x = W / 2 - w / 2;
        const path = () => {
            ctx.beginPath();
            ctx.moveTo(x, y + h);
            ctx.lineTo(x, y + w / 2);
            ctx.arc(W / 2, y + w / 2, w / 2, Math.PI, 0);
            ctx.lineTo(x + w, y + h);
            ctx.closePath();
        };
        ctx.save();
        path();
        ctx.clip();
        const pw = photo.naturalWidth || photo.width;
        const ph = photo.naturalHeight || photo.height;
        const s = Math.max(w / pw, h / ph);
        ctx.shadowBlur = 0;
        ctx.drawImage(photo, W / 2 - (pw * s) / 2, y + h / 2 - (ph * s) / 2, pw * s, ph * s);
        ctx.restore();
        ctx.strokeStyle = goldGradient(ctx, x, y, x + w, y + h, accent);
        ctx.lineWidth = 6 * scale;
        path();
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(W / 2, y + h / 2);
        ctx.scale(1.07, 1.05);
        ctx.translate(-W / 2, -(y + h / 2));
        path();
        ctx.stroke();
        ctx.restore();
    }
    // ───────────────── particles & intros ─────────────────
    drawParticles(t, still) {
        const { design } = this.input;
        const style = design.particles;
        if (style === "none")
            return;
        const ctx = this.ctx;
        const pal = design.palette;
        const tt = still ? 8 : t;
        const fadeIn = still ? 1 : clamp01((t - 0.3) / 1.5);
        const r = rng(style.length * 97);
        ctx.save();
        ctx.globalAlpha = fadeIn;
        const count = style === "confetti" ? 60 : style === "sparkles" ? 46 : style === "bokeh" ? 26 : 38;
        for (let i = 0; i < count; i++) {
            const x0 = r() * W, y0 = r() * H, sp = r(), ph = r() * Math.PI * 2, sz = r();
            if (style === "petals" || style === "marigold") {
                const speed = 60 + sp * 90;
                const y = ((y0 + tt * speed) % (H + 120)) - 60;
                const x = x0 + Math.sin(tt * 0.8 + ph) * 46;
                const flip = Math.cos(tt * 1.6 + ph);
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(ph + tt * (0.6 + sp));
                ctx.scale(flip, 1);
                const c = style === "petals" ? (i % 3 === 0 ? lighten(pal.flower, 0.45) : pal.flower) : i % 2 ? "#f28a17" : "#ffc629";
                const s = 12 + sz * 14;
                const g = ctx.createLinearGradient(-s, 0, s, 0);
                g.addColorStop(0, darken(c, 0.2));
                g.addColorStop(1, lighten(c, 0.25));
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(0, -s);
                ctx.bezierCurveTo(s * 0.9, -s * 0.8, s * 0.8, s * 0.6, 0, s);
                ctx.bezierCurveTo(-s * 0.8, s * 0.6, -s * 0.9, -s * 0.8, 0, -s);
                ctx.fill();
                ctx.restore();
            }
            else if (style === "confetti") {
                const speed = 140 + sp * 160;
                const y = ((y0 + tt * speed) % (H + 80)) - 40;
                const x = x0 + Math.sin(tt * 1.4 + ph) * 30;
                const colors = [pal.accent, pal.flower, lighten(pal.sky, 0.4), "#ffffff"];
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(ph + tt * 3 * (sp - 0.5));
                ctx.scale(1, Math.cos(tt * 4 + ph));
                ctx.fillStyle = colors[i % colors.length];
                ctx.fillRect(-7, -12, 14, 24);
                ctx.restore();
            }
            else if (style === "sparkles") {
                const a = Math.max(0, Math.sin(tt * (1 + sp) + ph));
                sparkle(ctx, x0, (y0 - tt * 12 * sp + H) % H, 8 + sz * 14, i % 3 ? lighten(pal.accent, 0.5) : "#ffffff", a);
            }
            else if (style === "bokeh") {
                const y = ((y0 - tt * (20 + sp * 30)) % H + H) % H;
                const prev = ctx.globalCompositeOperation;
                ctx.globalCompositeOperation = "lighter";
                glow(ctx, x0 + Math.sin(tt * 0.5 + ph) * 30, y, 30 + sz * 50, i % 2 ? lighten(pal.accent, 0.3) : lighten(pal.flower, 0.3), 0.25);
                ctx.globalCompositeOperation = prev;
            }
        }
        ctx.restore();
    }
    drawIntro(t) {
        const { design } = this.input;
        const ctx = this.ctx;
        const pal = design.palette;
        if (design.intro === "envelope") {
            const opened = easeInOut(progress(t, 0.25, 1.1));
            const fade = easeOut(progress(t, 1.35, 1.35));
            if (fade >= 1)
                return;
            const x = 46, y = H * 0.2, w = W - 92, h = H * 0.64;
            const envelope = mix(pal.deep, pal.sky, 0.4);
            ctx.save();
            ctx.globalAlpha = 1 - fade;
            ctx.fillStyle = pal.deep;
            ctx.fillRect(0, 0, W, H);
            const body = ctx.createLinearGradient(x, y, x + w, y + h);
            body.addColorStop(0, lighten(envelope, 0.2));
            body.addColorStop(1, darken(envelope, 0.12));
            roundRect(ctx, x, y, w, h, 34);
            ctx.fillStyle = body;
            ctx.fill();
            ctx.strokeStyle = goldGradient(ctx, x, y, x + w, y + h, pal.accent);
            ctx.lineWidth = 7;
            roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 30);
            ctx.stroke();

            ctx.fillStyle = mix(envelope, pal.deep, 0.2);
            ctx.beginPath();
            ctx.moveTo(x + 4, y + h * 0.27);
            ctx.lineTo(x + w / 2, y + h * 0.62);
            ctx.lineTo(x + w - 4, y + h * 0.27);
            ctx.lineTo(x + w - 4, y + h - 4);
            ctx.lineTo(x + 4, y + h - 4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = alpha(pal.accent, 0.8);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x + 4, y + h * 0.27);
            ctx.lineTo(x + w / 2, y + h * 0.62);
            ctx.lineTo(x + w - 4, y + h * 0.27);
            ctx.stroke();

            const flapPoint = y + h * (0.66 - opened * 0.88);
            const flap = ctx.createLinearGradient(x, y, x + w, flapPoint);
            flap.addColorStop(0, lighten(envelope, 0.3));
            flap.addColorStop(1, darken(envelope, 0.06));
            ctx.fillStyle = flap;
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 5);
            ctx.lineTo(x + w - 5, y + 5);
            ctx.lineTo(x + w / 2, flapPoint);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = goldGradient(ctx, x, y, x + w, flapPoint, pal.accent);
            ctx.lineWidth = 6;
            ctx.stroke();

            const sealAlpha = 1 - easeOut(progress(t, 0.25, 0.45));
            if (sealAlpha > 0) {
                ctx.globalAlpha = (1 - fade) * sealAlpha;
                ctx.beginPath();
                ctx.arc(W / 2, y + h * 0.55, 54, 0, Math.PI * 2);
                ctx.fillStyle = pal.accent;
                ctx.fill();
                ctx.strokeStyle = lighten(pal.accent, 0.45);
                ctx.lineWidth = 5;
                ctx.stroke();
                ctx.fillStyle = isLight(pal.accent) ? pal.deep : "#fff8e8";
                ctx.font = this.font("serif", 38);
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("♥", W / 2, y + h * 0.55 + 2);
            }
            ctx.restore();
            return;
        }
        if (design.intro === "door") {
            const p = easeInOut(progress(t, 0.1, 2.5));
            if (p >= 1)
                return;
            const half = (W / 2) * (1 - p);
            const door = mix(pal.deep, pal.sky, 0.22);
            ctx.save();
            for (const side of [0, 1]) {
                const x = side ? W - half : 0;
                const g = ctx.createLinearGradient(x, 0, x + half, 0);
                g.addColorStop(0, darken(door, 0.18));
                g.addColorStop(0.75, door);
                g.addColorStop(1, lighten(door, 0.14));
                ctx.fillStyle = g;
                ctx.fillRect(x, 0, half, H);
                ctx.strokeStyle = goldGradient(ctx, x, 0, x + half, H, pal.accent);
                ctx.lineWidth = 8;
                ctx.strokeRect(side ? x + 6 : x + half - 14, 24, 8, H - 48);
                ctx.lineWidth = 3;
                ctx.strokeRect(side ? x + 30 : x + half - 38, 100, 4, H - 200);
                ctx.fillStyle = pal.accent;
                ctx.beginPath();
                ctx.arc(side ? x + half - 46 : x + half - 70, H * 0.52, 13, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            return;
        }
        if (design.intro === "page-turn") {
            const p = easeInOut(progress(t, 0.1, 2.3));
            if (p >= 1)
                return;
            const width = W * (1 - p);
            ctx.save();
            const page = ctx.createLinearGradient(W - width, 0, W, 0);
            page.addColorStop(0, lighten(pal.sky, 0.16));
            page.addColorStop(0.84, mix(pal.sky, pal.flower, 0.1));
            page.addColorStop(1, darken(pal.deep, 0.12));
            ctx.fillStyle = page;
            ctx.fillRect(W - width, 0, width, H);
            ctx.fillStyle = goldGradient(ctx, W - width - 12, 0, W - width + 12, 0, pal.accent);
            ctx.fillRect(W - width - 8, 0, 10, H);
            ctx.restore();
            return;
        }
        if (design.intro === "fade") {
            const p = easeOut(progress(t, 0, 2.6));
            if (p >= 1)
                return;
            ctx.fillStyle = alpha(darken(pal.deep, 0.3), 1 - p);
            ctx.fillRect(0, 0, W, H);
            return;
        }
        if (design.intro === "zoom") {
            const p = easeInOut(progress(t, 0.1, 2.7));
            if (p >= 1)
                return;
            const radius = 40 + p * Math.hypot(W / 2, H / 2) * 1.5;
            const g = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, radius);
            g.addColorStop(0, alpha(pal.deep, 0));
            g.addColorStop(0.72, alpha(pal.deep, 0.08 + (1 - p) * 0.1));
            g.addColorStop(1, alpha(pal.deep, 1 - p * 0.35));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
            return;
        }
        if (design.intro === "spotlight") {
            const p = easeOut(progress(t, 0.1, 2.5));
            if (p >= 1)
                return;
            const cx = W * (0.2 + p * 0.6), cy = H * (0.22 + p * 0.52), radius = 90 + p * 260;
            const g = ctx.createRadialGradient(cx, cy, radius * 0.28, cx, cy, radius * 2.2);
            g.addColorStop(0, alpha(pal.deep, 0));
            g.addColorStop(0.42, alpha(darken(pal.deep, 0.28), 0.22 * (1 - p)));
            g.addColorStop(1, alpha(darken(pal.deep, 0.5), 0.9 * (1 - p)));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
            return;
        }
        if (design.intro === "golden") {
            const p = easeInOut(progress(t, 0.1, 2.8));
            if (p >= 1)
                return;
            const x = -W * 0.7 + p * W * 2.4;
            const g = ctx.createLinearGradient(x - W * 0.55, 0, x + W * 0.55, H);
            g.addColorStop(0, alpha(pal.deep, 0.7 * (1 - p)));
            g.addColorStop(0.38, alpha(pal.deep, 0.24 * (1 - p)));
            g.addColorStop(0.5, alpha(lighten(pal.accent, 0.36), 0.72 * (1 - p)));
            g.addColorStop(0.62, alpha(pal.deep, 0.24 * (1 - p)));
            g.addColorStop(1, alpha(pal.deep, 0.7 * (1 - p)));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
            return;
        }
        if (design.intro === "shutter") {
            const p = easeInOut(progress(t, 0.1, 2.5));
            if (p >= 1)
                return;
            const band = H / 8;
            ctx.save();
            for (let i = 0; i < 8; i++) {
                const direction = i % 2 ? 1 : -1;
                const y = i * band + direction * p * (band + 12);
                ctx.fillStyle = i % 2 ? mix(pal.deep, pal.sky, 0.18) : darken(pal.deep, 0.12);
                ctx.fillRect(0, y, W, band + 3);
                ctx.fillStyle = alpha(pal.accent, 0.75 * (1 - p));
                ctx.fillRect(0, y + band - 4, W, 4);
            }
            ctx.restore();
            return;
        }
        if (design.intro === "heart") {
            const open = easeInOut(progress(t, 0.1, 2.4));
            const fade = easeOut(progress(t, 2.1, 1.0));
            if (fade >= 1)
                return;
            const scale = 0.04 + open * 1.2, cx = W / 2, cy = H * 0.5, rx = W * 0.48 * scale, ry = H * 0.47 * scale;
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, W, H);
            ctx.moveTo(cx, cy + ry * 0.82);
            ctx.bezierCurveTo(cx - rx * 1.25, cy + ry * 0.05, cx - rx, cy - ry * 0.82, cx, cy - ry * 0.36);
            ctx.bezierCurveTo(cx + rx, cy - ry * 0.82, cx + rx * 1.25, cy + ry * 0.05, cx, cy + ry * 0.82);
            ctx.clip("evenodd");
            ctx.fillStyle = alpha(pal.deep, 1 - fade);
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
            return;
        }
        if (design.intro === "stars") {
            const p = easeOut(progress(t, 0.2, 2.8));
            if (p >= 1)
                return;
            ctx.fillStyle = alpha(darken(pal.deep, 0.5), 0.88 * (1 - p));
            ctx.fillRect(0, 0, W, H);
            const r = rng(719);
            ctx.save();
            for (let i = 0; i < 34; i++) {
                const x = r() * W;
                const y = (r() * H + t * (35 + r() * 55)) % H;
                sparkle(ctx, x, y, 10 + r() * 23, i % 3 ? lighten(pal.accent, 0.28) : "#fff8e8", (1 - p) * (0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i))));
            }
            ctx.restore();
            return;
        }
        if (design.intro === "curtain") {
            const p = easeInOut(progress(t, 0.5, 2.2));
            if (p >= 1)
                return;
            const cc = darken(mix(pal.sky, pal.flower, 0.1), 0.15);
            const half = (W / 2) * (1 - p);
            ctx.save();
            ctx.fillStyle = darken(cc, 0.5);
            for (const side of [0, 1]) {
                const x = side ? W - half : 0;
                ctx.save();
                ctx.beginPath();
                ctx.rect(x, 0, half + 2, H);
                ctx.clip();
                const g = ctx.createLinearGradient(x, 0, x + W / 2, 0);
                for (let i = 0; i <= 16; i++)
                    g.addColorStop(i / 16, i % 2 ? lighten(cc, 0.18) : darken(cc, 0.35));
                ctx.fillStyle = g;
                ctx.fillRect(side ? W - W / 2 : 0, 0, W / 2, H);
                ctx.fillStyle = goldGradient(ctx, 0, 0, W, 0, pal.accent);
                ctx.fillRect(side ? x : x + half - 10, 0, 10, H);
                ctx.restore();
            }
            ctx.restore();
            return;
        }
        if (design.intro === "bloom") {
            const p = easeOut(progress(t, 0, 2.4));
            if (p >= 1)
                return;
            const r = 40 + p * 1700;
            const g = ctx.createRadialGradient(W / 2, H * 0.45, r * 0.4, W / 2, H * 0.45, r);
            const c = darken(pal.deep, 0.7);
            g.addColorStop(0, alpha(c, 0));
            g.addColorStop(1, alpha(c, 1 - p * 0.6));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            glow(ctx, W / 2, H * 0.45, 500 * (1 - p) + 100, lighten(pal.accent, 0.4), 0.6 * (1 - p));
            ctx.restore();
            return;
        }
        // petal burst
        const p = progress(t, 0, 2.6);
        if (p >= 1)
            return;
        ctx.fillStyle = alpha("#ffffff", 0.9 * (1 - easeOut(p * 1.6)));
        ctx.fillRect(0, 0, W, H);
        const r = rng(5);
        for (let i = 0; i < 46; i++) {
            const a = r() * Math.PI * 2, sp = 400 + r() * 900;
            const d = easeOut(p) * sp;
            const x = W / 2 + Math.cos(a) * d, y = H * 0.45 + Math.sin(a) * d + p * p * 300;
            ctx.save();
            ctx.globalAlpha = 1 - p;
            ctx.translate(x, y);
            ctx.rotate(a + p * 6);
            ctx.fillStyle = i % 2 ? pal.flower : i % 3 ? "#ffc629" : "#f28a17";
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    draw(t, opts = {}) {
        if (!this.input)
            return;
        const still = !!opts.still;
        const ctx = this.ctx;
        ctx.save();
        ctx.clearRect(0, 0, W, H);
        this.drawBackground(t, still);
        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.globalCompositeOperation = "soft-light";
        ctx.fillStyle = this.grain();
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        this.drawParticles(t, still);
        this.drawFrame(t, still);
        this.drawText(t, still);
        if (!still && !opts.skipIntro)
            this.drawIntro(t);
        if (!still && !opts.skipOutro) {
            // soft fade at the very end so the loop / video ending feels finished
            const out = progress(t, VIDEO_SECONDS - 0.6, 0.6);
            if (out > 0) {
                ctx.fillStyle = alpha(darken(this.input.design.palette.deep, 0.6), out * 0.5);
                ctx.fillRect(0, 0, W, H);
            }
        }
        ctx.restore();
    }
}
/** Render the finished card to a standalone canvas (PNG download, print, thumbnails). */
export async function renderStill(input, width = W) {
    await ensureFonts(input.design);
    const c = document.createElement("canvas");
    const r = new InviteRenderer(c);
    r.setInput(input);
    r.draw(VIDEO_SECONDS, { still: true });
    if (width === W)
        return c;
    const out = document.createElement("canvas");
    out.width = width;
    out.height = Math.round((width / W) * H);
    out.getContext("2d").drawImage(c, 0, 0, out.width, out.height);
    return out;
}


