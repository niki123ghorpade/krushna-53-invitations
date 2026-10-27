"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import InviteCanvas, { useInviteImages } from "@/components/InviteCanvas";
import Thumb, { cardThumbJob, photoFingerprint } from "@/components/Thumb";
import { ColorwayDots, DRAFT_KEY, Segmented, SiteFooter, SiteHeader, download } from "@/components/ui";
import { designFromDef, designOf, designsFor, traditionOf, wordingFor } from "@/lib/designs";
import { EVENT_ORDER, EVENT_PRESETS, FONT_PAIRS, DEMO_DETAILS, designForEvent, } from "@/lib/invite-design";
import { generateMusic, musicStyleFor, prepareUploadedMusic } from "@/lib/music";
import { canvasToPdf } from "@/lib/pdf";
import { loadImage, renderStill } from "@/lib/renderer";
import { encodeShare, fileToDataUrl, uploadImage } from "@/lib/share";
import { findTemplate, templateDesign } from "@/lib/templates";
import { saveUserTemplateRecord } from "@/lib/user-templates";
import { illustratedPhoto } from "@/lib/illustrated-photo";
const FRAMES = [
    { id: "toran", label: "Marigold toran" }, { id: "mandap", label: "Mandap" }, { id: "floral-corners", label: "Floral corners" },
    { id: "double-border", label: "Royal border" }, { id: "arch", label: "Mughal arch" }, { id: "jharokha", label: "Jharokha" }, { id: "none", label: "No frame" },
];
const BACKDROPS = [
    { id: "glow", label: "Soft glow" }, { id: "glass", label: "Glass card" }, { id: "scroll", label: "Paper scroll" }, { id: "paper", label: "Printed card" }, { id: "none", label: "None" },
];
const COMPOSITIONS = [
    { id: "classic", label: "Classic" }, { id: "monogram", label: "Monogram crest" }, { id: "weds", label: "Big names" }, { id: "dateblock", label: "Date block" }, { id: "grand", label: "Grand" },
];
const LAYOUTS = [{ id: "top", label: "Top" }, { id: "center", label: "Middle" }, { id: "bottom", label: "Bottom" }];
const PARTICLES = [
    { id: "petals", label: "Rose petals" }, { id: "marigold", label: "Marigold" }, { id: "sparkles", label: "Sparkles" },
    { id: "bokeh", label: "Fairy glow" }, { id: "confetti", label: "Confetti" }, { id: "none", label: "None" },
];
const INTROS = [{ id: "bloom", label: "Light bloom" }, { id: "curtain", label: "Curtain opening" }, { id: "petal-burst", label: "Petal burst" }];
const COLOR_FIELDS = [
    { key: "deep", label: "Background" }, { key: "sky", label: "Highlight" }, { key: "accent", label: "Gold & title" }, { key: "flower", label: "Flowers" }, { key: "text", label: "Text" },
];
export default function CreatePage() {
    const [details, setDetails] = useState(DEMO_DETAILS);
    const [design, setDesign] = useState(() => designForEvent("wedding"));
    const [mode, setMode] = useState("video");
    const [playing, setPlaying] = useState(true);
    const [restartKey, setRestartKey] = useState(0);
    const [muted, setMuted] = useState(true);
    const [thumbs, setThumbs] = useState({});
    const [artMode, setArtMode] = useState("scene");
    const [arts, setArts] = useState([]);
    const [musicChoice, setMusicChoice] = useState("auto");
    const [songFile, setSongFile] = useState(null);
    const [songOffset, setSongOffset] = useState(0);
    const [music, setMusic] = useState(null);
    const [exporting, setExporting] = useState(null);
    const [exportError, setExportError] = useState("");
    const [shareUrl, setShareUrl] = useState("");
    const [shareBusy, setShareBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [printSrc, setPrintSrc] = useState("");
    const [template, setTemplate] = useState(null);
    const [customTemplateName, setCustomTemplateName] = useState("");
    const [templateFeedback, setTemplateFeedback] = useState("");
    const abortRef = useRef(null);
    const loaded = useRef(false);
    const images = useInviteImages(design, details);
    // restore draft
    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) {
                const d = JSON.parse(raw);
                if (d.details && d.design?.palette) {
                    setDetails({ ...d.details, couplePhoto: undefined });
                    setDesign(d.design);
                    if (d.arts)
                        setArts(d.arts.filter((a) => a.shareUrl).map((a) => ({ ...a, source: "upload" })));
                    if (d.design.background.kind === "image")
                        setArtMode("upload");
                }
            }
        }
        catch { /* ignore broken drafts */ }
        const params = new URLSearchParams(window.location.search);
        const tpl = findTemplate(params.get("template"));
        if (tpl) {
            const w = tpl.savedWording ?? wordingFor({ event: tpl.event, scene: tpl.customDesign?.scene ?? tpl.id });
            setTemplate(tpl);
            setDesign(tpl.customDesign ? templateDesign(tpl) : designFromDef(tpl.def, Number(params.get("cw") ?? 0) || 0));
            setDetails((d) => ({ ...d, ...w }));
            setArtMode("scene");
        }
        const m = params.get("mode");
        if (m === "card" || m === "video")
            setMode(m);
        loaded.current = true;
    }, []);
    // save draft
    useEffect(() => {
        if (!loaded.current)
            return;
        const id = setTimeout(() => {
            try {
                const bg = design.background;
                const art = arts.find((a) => bg.kind === "image" && a.src === bg.src);
                const safeDesign = bg.kind === "image" && art?.shareUrl ? { ...design, background: { ...bg, src: art.shareUrl } } : bg.kind === "image" && bg.src.startsWith("data:") ? { ...design, background: { kind: "scene" } } : design;
                localStorage.setItem(DRAFT_KEY, JSON.stringify({ details, design: safeDesign, arts: arts.filter((a) => a.shareUrl).map((a) => ({ ...a, src: a.shareUrl })) }));
            }
            catch { /* storage full or blocked */ }
        }, 600);
        return () => clearTimeout(id);
    }, [details, design, arts]);
    // event thumbnails
    useEffect(() => {
        let alive = true;
        const id = setTimeout(async () => {
            const out = {};
            for (const kind of EVENT_ORDER) {
                const p = EVENT_PRESETS[kind];
                const c = await renderStill({ design: designForEvent(kind), details: { ...details, title: p.title, hostLine: p.hostLine, message: "", couplePhoto: undefined } }, 216);
                out[kind] = c.toDataURL("image/jpeg", 0.8);
            }
            if (alive)
                setThumbs(out);
        }, 400);
        return () => { alive = false; clearTimeout(id); };
    }, [details.brideName, details.groomName, details.date]); // eslint-disable-line react-hooks/exhaustive-deps
    // music
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (musicChoice === "none")
                    return setMusic(null);
                if (musicChoice === "upload") {
                    if (!songFile)
                        return setMusic(null);
                    const buf = await prepareUploadedMusic(songFile, songOffset);
                    if (alive)
                        setMusic(buf);
                    return;
                }
                const style = musicChoice === "auto" ? musicStyleFor(design.event) : musicChoice;
                const buf = await generateMusic(style);
                if (alive)
                    setMusic(buf);
            }
            catch {
                if (alive)
                    setMusic(null);
            }
        })();
        return () => { alive = false; };
    }, [musicChoice, songFile, songOffset, design.event]);
    const preset = EVENT_PRESETS[design.event];
    const currentDef = designOf(design);
    const photoKey = photoFingerprint(details.couplePhoto);
    const colorwayIndex = currentDef.colorways.findIndex((c) => JSON.stringify(c.palette) === JSON.stringify(design.palette));
    function chooseDesign(def) {
        const prev = wordingFor(design);
        const next = wordingFor({ event: def.event, scene: def.id });
        setDetails((d) => ({
            ...d,
            title: d.title === prev.title || !d.title ? next.title : d.title,
            hostLine: d.hostLine === prev.hostLine || !d.hostLine ? next.hostLine : d.hostLine,
            message: d.message === prev.message || !d.message ? next.message : d.message,
            blessing: d.blessing === prev.blessing || d.blessing === undefined ? next.blessing : d.blessing,
        }));
        setDesign((d) => ({ ...designFromDef(def, 0), showPhoto: d.showPhoto, background: { kind: "scene" } }));
        setArtMode("scene");
        setTemplate(null);
        setRestartKey((k) => k + 1);
        invalidateShare();
    }
    const invalidateShare = () => { setShareUrl(""); setCopied(false); };
    const updateDetails = (k, v) => { setDetails((d) => ({ ...d, [k]: v })); invalidateShare(); };
    const updateDesign = (patch) => { setDesign((d) => ({ ...d, ...patch })); invalidateShare(); };
    const setColor = (k, v) => updateDesign({ palette: { ...design.palette, [k]: v } });
    function chooseEvent(kind) {
        const prev = wordingFor(design);
        const next = EVENT_PRESETS[kind];
        setDetails((d) => ({
            ...d,
            title: d.title === prev.title || !d.title ? next.title : d.title,
            hostLine: d.hostLine === prev.hostLine || !d.hostLine ? next.hostLine : d.hostLine,
            message: d.message === prev.message || !d.message ? next.message : d.message,
            blessing: d.blessing === prev.blessing || d.blessing === undefined ? wordingFor({ event: kind, scene: designsFor(kind)[0].id }).blessing : d.blessing,
        }));
        const art = arts.find((a) => a.event === kind);
        setDesign({ ...designFromDef(designsFor(kind)[0]), showPhoto: design.showPhoto, ...(art && artMode !== "scene" ? { background: { kind: "image", src: art.src, source: art.source }, layout: "top", tint: 0 } : {}) });
        if (!art)
            setArtMode("scene");
        setTemplate(null);
        setRestartKey((k) => k + 1);
        invalidateShare();
    }
    function applyArt(a, extra = {}) {
        updateDesign({ background: { kind: "image", src: a.src, source: a.source }, tint: 0, ...extra });
        setRestartKey((k) => k + 1);
    }
    async function uploadArt(file) {
        if (!file || !file.type.startsWith("image/"))
            return;
        const src = await fileToDataUrl(file, 1080, 1920, 0.85);
        const item = { src, source: "upload", event: design.event };
        setArts((a) => [item, ...a].slice(0, 12));
        applyArt(item);
        uploadImage(src).then((url) => url && setArts((all) => all.map((x) => (x.src === src ? { ...x, shareUrl: url } : x))));
    }
    async function uploadCouplePhoto(file) {
        if (!file || !file.type.startsWith("image/"))
            return;
        const resized = await fileToDataUrl(file, 1080, 1920, 0.85);
        const illustrated = await illustratedPhoto(resized);
        setDetails((d) => ({ ...d, couplePhoto: illustrated, couplePhotoPosition: d.couplePhotoPosition ?? "top" }));
        updateDesign({ showPhoto: true });
    }
    function saveAsTemplate() {
        const name = customTemplateName.trim();
        if (!name) {
            setTemplateFeedback("Enter a name for this template first.");
            return;
        }
        // Keep uploaded artwork as part of this reusable design. Couple photos
        // are stored separately in details and are not copied into the template.
        const reusableDesign = { ...design };
        const saved = saveUserTemplateRecord({
            id: `my-${Date.now().toString(36)}`, name, event: design.event, design: reusableDesign,
            wording: { title: details.title, hostLine: details.hostLine, message: details.message, blessing: details.blessing },
            savedAt: Date.now(),
        });
        setTemplateFeedback(saved ? `“${name}” was added to Templates.` : "Could not save this template. Your browser storage may be full.");
        if (saved) {
            setCustomTemplateName("");
            try {
                sessionStorage.setItem("krushna53-template-saved-notice", name);
            }
            catch { /* session storage may be unavailable */ }
            window.location.assign("/templates");
        }
    }
    async function getReadyRenderInput() {
        const photo = details.couplePhoto && design.showPhoto ? await loadImage(details.couplePhoto) : null;
        const art = design.background.kind === "image" ? (images.art ?? await loadImage(design.background.src)) : images.art;
        return { design, details, art, photo };
    }
    async function downloadVideo() {
        setExportError("");
        setExporting(0);
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        try {
            const { exportInviteVideo } = await import("@/lib/export-video");
            const { blob, ext } = await exportInviteVideo(await getReadyRenderInput(), music, (p) => setExporting(p), { signal: ctrl.signal });
            download(blob, `${details.brideName}-${details.groomName}-${design.event}.${ext}`.replace(/\s+/g, "-").toLowerCase());
        }
        catch (e) {
            if (e.name !== "AbortError")
                setExportError(e instanceof Error ? e.message : "Export failed");
        }
        finally {
            setExporting(null);
        }
    }
    async function downloadPng() {
        const c = await renderStill(await getReadyRenderInput());
        c.toBlob((b) => b && download(b, `${details.brideName}-${details.groomName}-${design.event}.png`.replace(/\s+/g, "-").toLowerCase()), "image/png");
    }
    async function downloadPdf() {
        const c = await renderStill(await getReadyRenderInput());
        download(await canvasToPdf(c), `${details.brideName}-${details.groomName}-${design.event}.pdf`.replace(/\s+/g, "-").toLowerCase());
    }
    async function printCard() {
        const c = await renderStill(await getReadyRenderInput());
        setPrintSrc(c.toDataURL("image/jpeg", 0.95));
        setTimeout(() => window.print(), 300);
    }
    async function createLink() {
        setShareBusy(true);
        try {
            let shareDesign = design;
            if (design.background.kind === "image") {
                const bg = design.background;
                const art = arts.find((a) => a.src === bg.src);
                let url = art?.shareUrl ?? (bg.src.startsWith("data:") ? null : bg.src);
                if (!url)
                    url = (await uploadImage(bg.src)) ?? bg.src;
                shareDesign = { ...design, background: { ...bg, src: url } };
            }
            let shareDetails = details;
            if (details.couplePhoto && design.showPhoto) {
                const url = await uploadImage(details.couplePhoto);
                if (url)
                    shareDetails = { ...details, couplePhoto: url };
            }
            else
                shareDetails = { ...details, couplePhoto: undefined };
            const token = await encodeShare({ v: 2, mode, design: shareDesign, details: shareDetails, music: musicChoice === "none" ? "none" : musicChoice === "calm" || musicChoice === "festive" ? musicChoice : musicStyleFor(design.event) });
            setShareUrl(`${window.location.origin}/preview#i=${token}`);
        }
        finally {
            setShareBusy(false);
        }
    }
    async function copyLink() {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
        }
        catch {
            window.prompt("Copy your invitation link:", shareUrl);
        }
    }
    const eventArts = arts.filter((a) => a.event === design.event);
    const usingImage = design.background.kind === "image";
    return (<main className="studio">
      <SiteHeader active="/create"/>

      <section className="hero compact" id="top">
        <p className="eyebrow">{template ? "EDITING A TEMPLATE" : "CREATE MY OWN"}</p>
        <h1>{template ? <>{template.name}, <em>your way.</em></> : <>Design your invitation, <em>step by step.</em></>}</h1>
        <p>Choose the design and colours, decide between an animated video invite or a simple card, then tell your story.</p>
        {template && <p className="template-banner">Started from the <b>{template.name}</b> template · <a href="/templates">Change template</a></p>}
      </section>

      <div className="studio-grid">
        <div className="studio-form">
          {/* 01 DESIGN & COLOURS */}
          <section className="step">
            <header><span className="num">01</span><div><small>DESIGN WITH COLOUR OPTIONS</small><h2>Design & colours</h2></div></header>
            <div className="sub-label">CEREMONY</div>
            <div className="event-grid">
              {EVENT_ORDER.map((kind) => (<button type="button" key={kind} className={`event-card ${design.event === kind ? "on" : ""}`} onClick={() => chooseEvent(kind)} aria-pressed={design.event === kind}>
                  {thumbs[kind] ? <img src={thumbs[kind]} alt=""/> : <span className="thumb-skeleton"/>}
                  <b>{EVENT_PRESETS[kind].label}</b>
                </button>))}
            </div>
            <div className="sub-label">{preset.label.toUpperCase()} DESIGNS</div>
            <div className="design-grid">
              {designsFor(design.event).map((d) => (<button type="button" key={d.id} className={`design-card ${currentDef.id === d.id && design.background.kind === "scene" ? "on" : ""}`} onClick={() => chooseDesign(d)} aria-pressed={currentDef.id === d.id}>
                  <Thumb cacheKey={`card:${d.id}:0:${photoKey}:${details.brideName}:${details.groomName}:${details.date}`} make={cardThumbJob(designFromDef(d, 0), details)} alt={d.name}/>
                  <b>{d.name}</b>
                  <small>{traditionOf(d)}</small>
                </button>))}
            </div>
            <div className="sub-label">BACKDROP</div>
            <Segmented label="Artwork source" value={artMode} onChange={(v) => { setArtMode(v); if (v === "scene") {
        updateDesign({ background: { kind: "scene" }, layout: preset.layout });
        setRestartKey((k) => k + 1);
    } }} options={[{ id: "scene", label: "Illustrated scene" }, { id: "upload", label: "Upload my own" }]}/>
            {artMode === "scene" && <p className="hint">A hand-drawn {preset.label.toLowerCase()} scene that recolours with your palette and moves in the video: swaying garlands, twinkling lights, flickering diyas.</p>}
            {artMode === "upload" && (<div className="ai-panel">
                <p className="hint">Upload any 9:16 artwork (for example, one you made in Canva or a free AI image tool). Your text, frame and animation go on top.</p>
                <input type="file" accept="image/*" onChange={(e) => void uploadArt(e.target.files?.[0])}/>
              </div>)}
            {artMode !== "scene" && eventArts.length > 0 && (<div className="art-strip">
                {eventArts.map((a, i) => (<button type="button" key={i} className={design.background.kind === "image" && design.background.src === a.src ? "on" : ""} onClick={() => applyArt(a)}><img src={a.src} alt={`Artwork option ${i + 1}`}/></button>))}
              </div>)}
            <div className="sub-label">COLOURS</div>
            <div className="sub-label">COLOUR OPTIONS FOR “{currentDef.name.toUpperCase()}”</div>
            <ColorwayDots size="lg" colorways={currentDef.colorways} value={colorwayIndex} onChange={(i) => updateDesign({ palette: { ...currentDef.colorways[i].palette } })}/>
            <div className="sub-label">FINE-TUNE ANY COLOUR</div>
            <div className="color-row">
              {COLOR_FIELDS.map((f) => (<label key={f.key}><input type="color" value={design.palette[f.key]} onChange={(e) => setColor(f.key, e.target.value)}/><span>{f.label}</span></label>))}
            </div>
            {usingImage && (<label className="field range">RECOLOUR ARTWORK WITH PALETTE · {Math.round(design.tint * 100)}%<input type="range" min={0} max={1} step={0.05} value={design.tint} onChange={(e) => updateDesign({ tint: Number(e.target.value) })}/></label>)}
            <label className="field range">BRIGHTNESS · {Math.round(design.brightness * 100)}%<input type="range" min={0.6} max={1.3} step={0.05} value={design.brightness} onChange={(e) => updateDesign({ brightness: Number(e.target.value) })}/></label>
            <div className="sub-label">FRAME</div>
            <Segmented label="Frame" value={design.frame} onChange={(v) => updateDesign({ frame: v })} options={FRAMES}/>
            <div className="sub-label">LAYOUT STYLE</div>
            <Segmented label="Layout style" value={design.composition ?? "classic"} onChange={(v) => updateDesign({ composition: v })} options={COMPOSITIONS}/>
            <div className="sub-label">BLESSING LINE AT THE TOP</div>
            <div className="blessing-row">
              <Segmented label="Blessing line" value={design.blessing ? "on" : "off"} onChange={(v) => updateDesign({ blessing: v === "on" })} options={[{ id: "on", label: "Show" }, { id: "off", label: "Hide" }]}/>
              {design.blessing && <input className="blessing-input" aria-label="Blessing text" maxLength={60} value={details.blessing ?? ""} onChange={(e) => updateDetails("blessing", e.target.value)} placeholder="॥ श्री गणेशाय नमः ॥"/>}
            </div>
            <div className="sub-label">TEXT BACKING</div>
            <Segmented label="Text backing" value={design.backdrop} onChange={(v) => updateDesign({ backdrop: v })} options={BACKDROPS}/>
            <div className="two">
              <div><div className="sub-label">TEXT POSITION</div><Segmented label="Text position" value={design.layout} onChange={(v) => updateDesign({ layout: v })} options={LAYOUTS}/></div>
              <div><div className="sub-label">LETTERING</div><Segmented label="Lettering" value={design.fonts} onChange={(v) => updateDesign({ fonts: v })} options={Object.keys(FONT_PAIRS).map((k) => ({ id: k, label: FONT_PAIRS[k].label }))}/></div>
            </div>
            <div className="sub-label">SAVE THIS AS A REUSABLE TEMPLATE</div>
            <div className="fields two" id="save-template">
              <label className="field">TEMPLATE NAME<input maxLength={40} value={customTemplateName} onChange={(e) => setCustomTemplateName(e.target.value)} placeholder="e.g. Our ivory floral style"/></label>
              <button type="button" className="primary" onClick={saveAsTemplate}>Save to Templates</button>
            </div>
            <p className="hint small">Uploaded artwork is included. Your couple photo and personal names are not included.</p>
            {templateFeedback && <p className="hint small" role="status">{templateFeedback}</p>}
          </section>

          {/* 02 ANIMATED OR SIMPLE */}
          <section className="step">
            <header><span className="num">02</span><div><small>HOW SHOULD IT LOOK TO GUESTS?</small><h2>Animated or simple card</h2></div></header>
            <div className="mode-choice">
              <button type="button" className={mode === "video" ? "on" : ""} onClick={() => { setMode("video"); setPlaying(true); setRestartKey((k) => k + 1); invalidateShare(); }}>
                <span>▶</span><b>Animated</b><small>A 16-second video invite with music. Download as MP4 or share a link.</small>
              </button>
              <button type="button" className={mode === "card" ? "on" : ""} onClick={() => { setMode("card"); invalidateShare(); }}>
                <span>▤</span><b>Simple card</b><small>A still card. Download as PNG or PDF, or print it.</small>
              </button>
            </div>
            {mode === "video" && (<>
            <div className="sub-label">OPENING</div>
            <Segmented label="Opening" value={design.intro} onChange={(v) => { updateDesign({ intro: v }); setMode("video"); setPlaying(true); setRestartKey((k) => k + 1); }} options={INTROS}/>
            <div className="sub-label">FLOATING DETAILS</div>
            <Segmented label="Particles" value={design.particles} onChange={(v) => updateDesign({ particles: v })} options={PARTICLES}/>
            <div className="sub-label">MUSIC</div>
            <Segmented label="Music" value={musicChoice} onChange={setMusicChoice} options={[{ id: "auto", label: "Auto" }, { id: "calm", label: "Soft santoor" }, { id: "festive", label: "Festive dhol" }, { id: "upload", label: "My song" }, { id: "none", label: "No music" }]}/>
            {musicChoice === "upload" && (<div className="fields two">
                <label className="field">SONG FILE (MP3/M4A)<input type="file" accept="audio/*" onChange={(e) => setSongFile(e.target.files?.[0] ?? null)}/></label>
                <label className="field">START FROM (SECONDS)<input type="number" min={0} max={600} value={songOffset} onChange={(e) => setSongOffset(Number(e.target.value) || 0)}/></label>
              </div>)}
            <p className="hint small">Built-in music is generated in your browser and free to use. Only upload songs you have the rights to share.</p>
              </>)}
          </section>

          {/* 03 TELL YOUR STORY */}
          <section className="step">
            <header><span className="num">03</span><div><small>THE PEOPLE & THE PLAN</small><h2>Tell your story</h2></div></header>
            <div className="fields two">
              <label className="field">BRIDE<input maxLength={40} value={details.brideName} onChange={(e) => updateDetails("brideName", e.target.value)}/></label>
              <label className="field">GROOM<input maxLength={40} value={details.groomName} onChange={(e) => updateDetails("groomName", e.target.value)}/></label>
            </div>
            <div className="ai-panel">
              <label className="field">ADD A COUPLE PHOTO TO THIS DESIGN<input type="file" accept="image/*" onChange={(e) => void uploadCouplePhoto(e.target.files?.[0])}/></label>
              <p className="hint small">The photo gets a cartoon-style finish in your browser and appears larger in the selected template. Existing template artwork stays in place.</p>
              {details.couplePhoto && <Segmented label="Photo position" value={details.couplePhotoPosition ?? "top"} onChange={(v) => updateDetails("couplePhotoPosition", v)} options={[{ id: "top", label: "Top" }, { id: "bottom", label: "Bottom" }]}/>}
              {details.couplePhoto && <div className="fields two">
                <img src={details.couplePhoto} alt="Cartoon-styled couple preview" className="uploaded-couple-preview"/>
                <button type="button" className="button secondary" onClick={() => updateDetails("couplePhoto", undefined)}>Remove photo</button>
              </div>}
            </div>
            <label className="field">NAMES IN YOUR LANGUAGE (OPTIONAL)<input maxLength={40} value={details.nativeNames ?? ""} onChange={(e) => updateDetails("nativeNames", e.target.value)} placeholder="e.g. आरोही संग रेयांश"/></label>
            <div className="fields two">
              <label className="field">CARD TITLE<input maxLength={30} value={details.title} onChange={(e) => updateDetails("title", e.target.value)}/></label>
              <label className="field">OPENING LINE<input maxLength={70} value={details.hostLine} onChange={(e) => updateDetails("hostLine", e.target.value)}/></label>
            </div>
            <div className="fields two">
              <label className="field">DATE<input type="date" value={details.date} onChange={(e) => updateDetails("date", e.target.value)}/></label>
              <label className="field">TIME<input type="time" value={details.time} onChange={(e) => updateDetails("time", e.target.value)}/></label>
            </div>
            <div className="fields two">
              <label className="field">VENUE<input maxLength={70} value={details.venue} onChange={(e) => updateDetails("venue", e.target.value)}/></label>
              <label className="field">CITY<input maxLength={50} value={details.city} onChange={(e) => updateDetails("city", e.target.value)}/></label>
            </div>
            <label className="field">NOTE FOR GUESTS<textarea rows={2} maxLength={160} value={details.message} onChange={(e) => updateDetails("message", e.target.value)}/></label>
          </section>

        </div>

        <aside className="studio-preview">
          <div className="preview-sticky">
            <div className="preview-tabs">
              <Segmented label="Preview" value={mode} onChange={(v) => { setMode(v); invalidateShare(); if (v === "video") {
        setPlaying(true);
        setRestartKey((k) => k + 1);
    } }} options={[{ id: "video", label: "▶ Animated" }, { id: "card", label: "▤ Simple card" }]}/>
            </div>
            <div className="phone">
              <InviteCanvas design={design} details={details} mode={mode} playing={playing} restartKey={restartKey} music={music} muted={muted} className="invite-canvas"/>
            </div>
            {mode === "video" ? (<div className="preview-actions">
                <button type="button" onClick={() => { setPlaying(true); setRestartKey((k) => k + 1); }}>↻ Replay</button>
                <button type="button" onClick={() => setPlaying((p) => !p)}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
                <button type="button" onClick={() => { setMuted((m) => !m); setRestartKey((k) => k + 1); }}>{muted ? "🔇 Sound off" : "🔊 Sound on"}</button>
              </div>) : null}
            <div className="download-box">
              {mode === "video" ? (exporting !== null ? (<div className="progress"><div style={{ width: `${Math.round(exporting * 100)}%` }}/><span>Making your video… {Math.round(exporting * 100)}%</span><button type="button" className="link" onClick={() => abortRef.current?.abort()}>Cancel</button></div>) : (<button type="button" className="primary" onClick={downloadVideo}>↓ Download video (MP4, 9:16 HD)</button>)) : (<>
                  <div className="two-buttons"><button type="button" className="primary" onClick={downloadPng}>↓ Download PNG</button><button type="button" className="primary" onClick={downloadPdf}>↓ Download PDF</button></div>
                  <button type="button" className="secondary" onClick={printCard}>Print card</button>
                </>)}
              {exportError && <p className="error">{exportError}</p>}
              <button type="button" className="secondary" disabled={shareBusy} onClick={createLink}>{shareBusy ? "Preparing link…" : `Create guest link (${mode === "video" ? "video" : "card"})`}</button>
              {shareUrl && (<div className="share">
                  <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()}/>
                  {shareUrl.length > 4000 && <p className="hint small">This link is long because your images are packed inside it. On the live Netlify site, images are stored online and links stay short.</p>}
                  <div className="two-buttons"><button type="button" onClick={copyLink}>{copied ? "Copied ✓" : "Copy link"}</button><a href={shareUrl} target="_blank" rel="noreferrer">Open ↗</a></div>
                  <a className="whatsapp" href={`https://wa.me/?text=${encodeURIComponent(`You're invited to our ${details.title}! ${shareUrl}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
                </div>)}
            </div>
          </div>
        </aside>
      </div>
      <SiteFooter />
      {printSrc && typeof document !== "undefined" && createPortal(<div className="print-only"><img src={printSrc} alt="Invitation card"/></div>, document.body)}
    </main>);
}
