"use client";
import { useEffect, useRef, useState } from "react";
import InviteCanvas, { useInviteImages } from "@/components/InviteCanvas";
import Thumb, { cardThumbJob, photoFingerprint } from "@/components/Thumb";
import { ColorwayDots, DRAFT_KEY, Segmented, SiteFooter, SiteHeader, download } from "@/components/ui";
import { designFromDef, designOf, designsFor, traditionOf, wordingFor } from "@/lib/designs";
import { EVENT_ORDER, EVENT_PRESETS, DEMO_DETAILS, designForEvent, } from "@/lib/invite-design";
import { generateMusic, musicStyleFor } from "@/lib/music";
import { canvasToPdf } from "@/lib/pdf";
import { loadImage, renderStill } from "@/lib/renderer";
import { fileToDataUrl, uploadImage } from "@/lib/share";
import { findTemplate, templateDesign } from "@/lib/templates";
import { saveUserTemplateRecord } from "@/lib/user-templates";
import SocialShareActions from "@/components/SocialShareActions";
const FRAMES = [
    { id: "toran", label: "Marigold toran" }, { id: "mandap", label: "Mandap" }, { id: "floral-corners", label: "Floral corners" },
    { id: "double-border", label: "Royal border" }, { id: "arch", label: "Mughal arch" }, { id: "jharokha", label: "Jharokha" }, { id: "none", label: "No frame" },
];
const INTRO_ANIMATIONS = [
    { id: "bloom", label: "Bloom" }, { id: "curtain", label: "Curtain reveal" }, { id: "petal-burst", label: "Petal burst" },
    { id: "envelope", label: "Envelope opening" }, { id: "door", label: "Door opening" }, { id: "page-turn", label: "Page turn" },
    { id: "fade", label: "Soft fade" }, { id: "zoom", label: "Zoom reveal" }, { id: "spotlight", label: "Spotlight" },
    { id: "golden", label: "Golden shimmer" }, { id: "shutter", label: "Shutter reveal" }, { id: "heart", label: "Heart reveal" },
    { id: "stars", label: "Star shower" },
];
export default function CreatePage() {
    const [details, setDetails] = useState(() => ({ ...DEMO_DETAILS, brideName: "", groomName: "", date: "", venue: "", city: "" }));
    const [design, setDesign] = useState(() => designForEvent("wedding"));
    const [mode, setMode] = useState("video");
    const [playing, setPlaying] = useState(true);
    const [restartKey, setRestartKey] = useState(0);
    const [muted, setMuted] = useState(true);
    const [thumbs, setThumbs] = useState({});
    const [artMode, setArtMode] = useState("scene");
    const [arts, setArts] = useState([]);
    const [musicChoice, setMusicChoice] = useState("auto");
    const [music, setMusic] = useState(null);
    const [exporting, setExporting] = useState(null);
    const [exportError, setExportError] = useState("");
    const [downloadedFile, setDownloadedFile] = useState(null);
    const printJobRef = useRef(null);
    const [template, setTemplate] = useState(null);
    const [customTemplateName, setCustomTemplateName] = useState("");
    const [templateFeedback, setTemplateFeedback] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [flowStatus, setFlowStatus] = useState("");
    const abortRef = useRef(null);
    const loaded = useRef(false);
    const images = useInviteImages(design, details);
    useEffect(() => () => printJobRef.current?.(), []);
    useEffect(() => { setDownloadedFile(null); }, [musicChoice]);
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
        if (!tpl && params.get("tier") === "basic") {
            const simple = findTemplate("ivory-botanical");
            if (simple) { setDesign(templateDesign(simple)); setTemplate(simple); }
        }
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
        if (params.get("artwork") === "upload") setArtMode("upload");
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
    }, [musicChoice, design.event]);
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
    const invalidateShare = () => { setDownloadedFile(null); };
    const updateDetails = (k, v) => {
        setDetails((d) => ({ ...d, [k]: v }));
        setFieldErrors((errors) => { const next = { ...errors }; delete next[k]; return next; });
        setFlowStatus("");
        invalidateShare();
    };
    const updateDesign = (patch) => { setDesign((d) => ({ ...d, ...patch })); invalidateShare(); };
    function validateRequiredDetails() {
        const errors = {};
        if (!details.brideName.trim()) errors.brideName = "Enter the bride’s name.";
        if (!details.groomName.trim()) errors.groomName = "Enter the groom’s name.";
        if (!details.date || Number.isNaN(new Date(`${details.date}T00:00:00`).getTime())) errors.date = "Choose a valid event date.";
        if (!details.venue.trim()) errors.venue = "Enter the venue or location.";
        setFieldErrors(errors);
        if (Object.keys(errors).length) {
            setFlowStatus("Complete the required fields before downloading or publishing.");
            const firstField = Object.keys(errors)[0];
            document.getElementById(firstField)?.focus({ preventScroll: true });
            document.getElementById(firstField)?.scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }
        setFlowStatus("");
        return true;
    }
    function saveDraftNow() {
        try {
            const bg = design.background;
            const art = arts.find((a) => bg.kind === "image" && a.src === bg.src);
            const safeDesign = bg.kind === "image" && art?.shareUrl ? { ...design, background: { ...bg, src: art.shareUrl } } : bg.kind === "image" && bg.src.startsWith("data:") ? { ...design, background: { kind: "scene" } } : design;
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ details, design: safeDesign, arts: arts.filter((a) => a.shareUrl).map((a) => ({ ...a, src: a.shareUrl })) }));
            setFlowStatus("Draft saved on this device.");
        }
        catch {
            setFlowStatus("Could not save the draft in this browser.");
        }
    }
    const setColor = (key, value) => updateDesign({ palette: { ...design.palette, [key]: value } });
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
    function removeArt(item) {
        setArts((all) => all.filter((a) => a.src !== item.src));
        if (design.background.kind === "image" && design.background.src === item.src) {
            setArtMode("scene");
            updateDesign({ background: { kind: "scene" }, layout: preset.layout });
            setRestartKey((key) => key + 1);
        }
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
    function saveAsTemplate() {
        const name = customTemplateName.trim();
        if (!name) {
            setTemplateFeedback("Add a template name first.");
            return;
        }
        const saved = saveUserTemplateRecord({
            id: `my-${Date.now().toString(36)}`, name, event: design.event, design: { ...design },
            wording: { title: details.title, hostLine: details.hostLine, message: details.message, blessing: details.blessing }, savedAt: Date.now(),
        });
        setTemplateFeedback(saved ? `“${name}” was saved to Templates on this browser only.` : "Could not save this template. Your browser storage may be full.");
        if (saved) {
            setCustomTemplateName("");
            try { sessionStorage.setItem("krushna53-template-saved-notice", name); }
            catch { /* storage may be unavailable */ }
        }
    }
    async function getReadyRenderInput() {
        const photo = details.couplePhoto && design.showPhoto ? await loadImage(details.couplePhoto) : null;
        const art = design.background.kind === "image" ? (images.art ?? await loadImage(design.background.src)) : images.art;
        return { design, details, art, photo };
    }
    async function downloadVideo() {
        if (!validateRequiredDetails()) return;
        setExportError("");
        setFlowStatus("");
        setDownloadedFile(null);
        setExporting(0);
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        let completed = false;
        try {
            const { exportInviteVideo } = await import("@/lib/export-video");
            const { blob, ext } = await exportInviteVideo(await getReadyRenderInput(), music, (p) => setExporting(p), { signal: ctrl.signal });
            const filename = `${details.brideName}-${details.groomName}-${design.event}.${ext}`.replace(/\s+/g, "-").toLowerCase();
            download(blob, filename);
            setDownloadedFile(new File([blob], filename, { type: blob.type || (ext === "mp4" ? "video/mp4" : "video/webm") }));
            setExporting(1);
            completed = true;
            setFlowStatus("Your invitation video has been downloaded.");
        }
        catch (e) {
            if (e.name !== "AbortError")
                setExportError(e instanceof Error ? e.message : "Export failed");
        }
        finally {
            if (completed) window.setTimeout(() => setExporting(null), 450);
            else setExporting(null);
        }
    }
    async function downloadPng() {
        if (!validateRequiredDetails()) return;
        setExportError("");
        setFlowStatus("");
        setDownloadedFile(null);
        setExporting(0);
        let completed = false;
        try {
            const c = await renderStill(await getReadyRenderInput());
            const blob = await new Promise((resolve, reject) => c.toBlob((image) => image ? resolve(image) : reject(new Error("Could not create the PNG. Please try again.")), "image/png"));
            const filename = `${details.brideName}-${details.groomName}-${design.event}.png`.replace(/\s+/g, "-").toLowerCase();
            download(blob, filename);
            setDownloadedFile(new File([blob], filename, { type: "image/png" }));
            setExporting(1);
            completed = true;
            setFlowStatus("Your invitation PNG has been downloaded.");
        } catch (error) {
            setExportError(error instanceof Error ? error.message : "Could not create the PNG. Please try again.");
        } finally {
            if (completed) window.setTimeout(() => setExporting(null), 450);
            else setExporting(null);
        }
    }
    async function downloadPdf() {
        if (!validateRequiredDetails()) return;
        setExportError("");
        setFlowStatus("");
        setDownloadedFile(null);
        setExporting(0);
        let completed = false;
        try {
            const c = await renderStill(await getReadyRenderInput());
            const blob = await canvasToPdf(c);
            const filename = `${details.brideName}-${details.groomName}-${design.event}.pdf`.replace(/\s+/g, "-").toLowerCase();
            download(blob, filename);
            setDownloadedFile(new File([blob], filename, { type: "application/pdf" }));
            setExporting(1);
            completed = true;
            setFlowStatus("Your invitation PDF has been downloaded.");
        } catch (error) {
            setExportError(error instanceof Error ? error.message : "Could not create the PDF. Please try again.");
        } finally {
            if (completed) window.setTimeout(() => setExporting(null), 450);
            else setExporting(null);
        }
    }
    async function printCard() {
        if (!validateRequiredDetails()) return;
        setExportError("");
        try {
            const c = await renderStill(await getReadyRenderInput());
            const pdf = await canvasToPdf(c);
            printJobRef.current?.();
            const url = URL.createObjectURL(pdf);
            const frame = document.createElement("iframe");
            frame.title = "Print invitation card";
            frame.style.cssText = "position:fixed;width:1px;height:1px;right:0;bottom:0;border:0;opacity:0;pointer-events:none";
            const cleanup = () => { frame.remove(); URL.revokeObjectURL(url); };
            printJobRef.current = cleanup;
            frame.onload = () => {
                try {
                    frame.contentWindow.focus();
                    frame.contentWindow.print();
                } catch {
                    download(pdf, "invitation-print.pdf");
                    setFlowStatus("Print-ready PDF downloaded. Open it and choose Print.");
                    cleanup();
                }
            };
            frame.src = url;
            document.body.appendChild(frame);
        } catch (error) {
            setExportError(error instanceof Error ? error.message : "Could not print the card. Please try again.");
        }
    }
    const eventArts = arts.filter((a) => a.event === design.event);
    return (<main className="studio">
      <SiteHeader active="/create"/>

      <section className="hero compact" id="top">
        <p className="eyebrow">{template ? "EDITING A TEMPLATE" : "CREATE MY OWN"}</p>
        <h1>{template ? <>{template.name}, <em>your way.</em></> : <>Design your invitation, <em>step by step.</em></>}</h1>
        <p>Choose the design and colours, decide between an animated video invite or a simple card, then tell your story.</p>
        {template && <p className="template-banner">Started from the <b>{template.name}</b> template · <a href="/templates">Change template</a></p>}
        <a className="create-back" href="/templates">← Back to templates</a>
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
            <div className="sub-label" id="artwork">BACKDROP</div>
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
                {eventArts.map((a, i) => (<div className="art-choice" key={a.src}><button type="button" className={design.background.kind === "image" && design.background.src === a.src ? "on" : ""} onClick={() => applyArt(a)}><img src={a.src} alt={`Artwork option ${i + 1}`}/></button><button type="button" className="remove-art" onClick={() => removeArt(a)} aria-label={`Remove artwork option ${i + 1}`}>×</button></div>))}
              </div>)}
            <div className="sub-label">COLOURS</div>
            <ColorwayDots size="lg" colorways={currentDef.colorways} value={colorwayIndex} onChange={(i) => updateDesign({ palette: { ...currentDef.colorways[i].palette } })}/>
            {artMode === "upload" && <div className="upload-colours"><p className="hint small">Choose the lettering colours that sit on top of your uploaded image.</p><div className="color-row"><label><input type="color" value={design.palette.text} onChange={(e) => setColor("text", e.target.value)}/><span>Text</span></label><label><input type="color" value={design.palette.accent} onChange={(e) => setColor("accent", e.target.value)}/><span>Accent & frame</span></label></div></div>}
            <div className="sub-label">FRAME</div>
            <Segmented label="Frame" value={design.frame} onChange={(v) => updateDesign({ frame: v })} options={FRAMES}/>
            <div className="save-template-row" id="save-template">
              <label className="field">SAVE AS TEMPLATE<input maxLength={40} value={customTemplateName} onChange={(e) => setCustomTemplateName(e.target.value)} placeholder="e.g. Our floral style"/></label>
              <button type="button" className="primary" onClick={saveAsTemplate}>Save template</button>
            </div>
            {templateFeedback && <p className="hint small" role="status">{templateFeedback}</p>}
          </section>

          {/* 02 ANIMATED OR SIMPLE */}
          <section className="step">
            <header><span className="num">02</span><div><small>HOW SHOULD IT LOOK TO GUESTS?</small><h2>Animated or simple card</h2></div></header>
            <div className="mode-choice">
              <button type="button" className={mode === "video" ? "on" : ""} onClick={() => { setMode("video"); setPlaying(true); setRestartKey((k) => k + 1); invalidateShare(); }}>
                <span>▶</span><b>Animated</b><small>A 16-second video invite with music. Download as MP4, then share it on social media.</small>
              </button>
              <button type="button" className={mode === "card" ? "on" : ""} onClick={() => { setMode("card"); invalidateShare(); }}>
                <span>▤</span><b>Simple card</b><small>A still card. Download as PNG or PDF, or print it.</small>
              </button>
            </div>
            {mode === "video" && (<>
            <div className="sub-label">MUSIC</div>
            <Segmented label="Music" value={musicChoice} onChange={setMusicChoice} options={[{ id: "auto", label: "Auto" }, { id: "calm", label: "Soft" }, { id: "festive", label: "Festive" }, { id: "none", label: "No music" }]}/>
            <div className="sub-label">ANIMATION</div>
            <label className="field">ANIMATION STYLE<select aria-label="Animation style" value={design.intro ?? "bloom"} onChange={(e) => { updateDesign({ intro: e.target.value }); setPlaying(true); setRestartKey((k) => k + 1); }}>{INTRO_ANIMATIONS.map((animation) => <option key={animation.id} value={animation.id}>{animation.label}</option>)}</select></label>
              </>)}
          </section>

          {/* 03 TELL YOUR STORY */}
          <section className="step">
            <header><span className="num">03</span><div><small>THE PEOPLE & THE PLAN</small><h2>Tell your story</h2></div></header>
            <p className="hint small">Fields marked * are required. Replace the sample details with your event information; the preview updates as you type. Your draft saves automatically in this browser.</p>
            <div className="fields two">
              <label className="field">BRIDE’S NAME *<input id="brideName" name="brideName" required aria-invalid={!!fieldErrors.brideName} aria-describedby={fieldErrors.brideName ? "brideName-error" : undefined} maxLength={40} value={details.brideName} placeholder="e.g. Aarohi" onChange={(e) => updateDetails("brideName", e.target.value)}/>{fieldErrors.brideName && <span className="field-error" id="brideName-error">{fieldErrors.brideName}</span>}</label>
              <label className="field">GROOM’S NAME *<input id="groomName" name="groomName" required aria-invalid={!!fieldErrors.groomName} aria-describedby={fieldErrors.groomName ? "groomName-error" : undefined} maxLength={40} value={details.groomName} placeholder="e.g. Reyansh" onChange={(e) => updateDetails("groomName", e.target.value)}/>{fieldErrors.groomName && <span className="field-error" id="groomName-error">{fieldErrors.groomName}</span>}</label>
            </div>
            <label className="field">NAMES IN YOUR LANGUAGE (OPTIONAL)<input maxLength={40} value={details.nativeNames ?? ""} onChange={(e) => updateDetails("nativeNames", e.target.value)} placeholder="e.g. आरोही संग रेयांश"/></label>
            <div className="fields two">
              <label className="field">CARD TITLE<input maxLength={30} value={details.title} onChange={(e) => updateDetails("title", e.target.value)}/></label>
              <label className="field">OPENING LINE<input maxLength={70} value={details.hostLine} onChange={(e) => updateDetails("hostLine", e.target.value)}/></label>
            </div>
            <div className="fields two">
              <label className="field">EVENT DATE *<input id="date" name="date" type="date" required aria-invalid={!!fieldErrors.date} aria-describedby={fieldErrors.date ? "date-error" : undefined} value={details.date} onChange={(e) => updateDetails("date", e.target.value)}/>{fieldErrors.date && <span className="field-error" id="date-error">{fieldErrors.date}</span>}</label>
              <label className="field">TIME (OPTIONAL)<input type="time" value={details.time} onChange={(e) => updateDetails("time", e.target.value)}/></label>
            </div>
            <div className="fields two">
              <label className="field">VENUE / LOCATION *<input id="venue" name="venue" required aria-invalid={!!fieldErrors.venue} aria-describedby={fieldErrors.venue ? "venue-error" : undefined} maxLength={70} value={details.venue} placeholder="e.g. The Gulmohar Palace" onChange={(e) => updateDetails("venue", e.target.value)}/>{fieldErrors.venue && <span className="field-error" id="venue-error">{fieldErrors.venue}</span>}</label>
              <label className="field">CITY (OPTIONAL)<input maxLength={50} value={details.city} placeholder="e.g. Jaipur, Rajasthan" onChange={(e) => updateDetails("city", e.target.value)}/></label>
            </div>
            <label className="field">NOTE FOR GUESTS<textarea rows={2} maxLength={160} value={details.message} onChange={(e) => updateDetails("message", e.target.value)}/></label>
            <div className="flow-actions"><button type="button" onClick={saveDraftNow}>Save draft</button><button type="button" onClick={() => document.getElementById("live-preview")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Preview invitation</button></div>
            {flowStatus && <p className="flow-status" role="status" aria-live="polite">{flowStatus}</p>}
          </section>

        </div>

        <aside className="studio-preview" id="live-preview" aria-label="Live invitation preview">
          <div className="preview-sticky">
            <p className="preview-heading">LIVE PREVIEW <span>Updates as you edit</span></p>
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
              {exporting !== null ? (<div className="progress"><div style={{ width: `${Math.round(exporting * 100)}%` }}/><span>Making your {mode === "video" ? "video" : "card"}… {Math.round(exporting * 100)}%</span>{exporting < 1 && mode === "video" && <button type="button" className="link" onClick={() => abortRef.current?.abort()}>Cancel</button>}</div>) : mode === "video" ? (<button type="button" className="primary" onClick={downloadVideo}>↓ Download video (MP4, 9:16 HD)</button>) : (<>
                  <div className="two-buttons"><button type="button" className="primary" onClick={downloadPng}>↓ Download PNG</button><button type="button" className="primary" onClick={downloadPdf}>↓ Download PDF</button></div>
                  <button type="button" className="secondary" onClick={printCard}>Print card</button>
                </>)}
              {exportError && <p className="error">{exportError}</p>}
              {downloadedFile && exporting === null && <SocialShareActions key={`${downloadedFile.name}:${downloadedFile.lastModified}`} file={downloadedFile} type={mode === "video" ? "invitation video" : "invitation card"} />}
            </div>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </main>);
}
