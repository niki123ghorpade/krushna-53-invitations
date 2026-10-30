"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import ReelCanvas, { useReelInput } from "@/components/ReelCanvas";
import Thumb, { cardThumbJob } from "@/components/Thumb";
import { ColorwayDots, DRAFT_KEY, Segmented, SiteFooter, SiteHeader, download, readSavedDetails } from "@/components/ui";
import { designFromDef, designOf, designsFor, traditionOf, wordingFor } from "@/lib/designs";
import { DEMO_DETAILS, EVENT_ORDER, EVENT_PRESETS, FONT_PAIRS, } from "@/lib/invite-design";
import { generateMusic, musicStyleFor, prepareUploadedMusic } from "@/lib/music";
import { REEL_KINDS, defaultJourney, findReelTemplate, reelDesign, reelDuration } from "@/lib/reels";
import { fileToDataUrl } from "@/lib/share";
import SocialShareActions from "@/components/SocialShareActions";
const COLOR_FIELDS = [
    { key: "deep", label: "Background" }, { key: "sky", label: "Highlight" }, { key: "accent", label: "Gold & title" }, { key: "flower", label: "Flowers" }, { key: "text", label: "Text" },
];
const COMPOSITIONS = [
    { id: "classic", label: "Classic" }, { id: "monogram", label: "Monogram crest" }, { id: "weds", label: "Big names" }, { id: "dateblock", label: "Date block" }, { id: "grand", label: "Grand" },
];
const PARTICLES = [
    { id: "petals", label: "Rose petals" }, { id: "marigold", label: "Marigold" }, { id: "sparkles", label: "Sparkles" },
    { id: "bokeh", label: "Fairy glow" }, { id: "confetti", label: "Confetti" }, { id: "none", label: "None" },
];
const INTROS = [{ id: "bloom", label: "Light bloom" }, { id: "curtain", label: "Curtain opening" }, { id: "petal-burst", label: "Petal burst" }];
const MAX_PHOTOS = 6;
export default function ReelMaker() {
    const [tpl, setTpl] = useState(null);
    const [kind, setKind] = useState("classic");
    const [design, setDesign] = useState(() => designFromDef(designsFor("wedding")[1], 1));
    const [details, setDetails] = useState(DEMO_DETAILS);
    const [events, setEvents] = useState(() => defaultJourney(["haldi", "mehndi", "sangeet", "wedding", "reception"], DEMO_DETAILS.date, DEMO_DETAILS.venue));
    const [photos, setPhotos] = useState([]);
    const [playing, setPlaying] = useState(true);
    const [restartKey, setRestartKey] = useState(0);
    const [muted, setMuted] = useState(true);
    const [musicChoice, setMusicChoice] = useState("auto");
    const [songFile, setSongFile] = useState(null);
    const [songOffset, setSongOffset] = useState(0);
    const [music, setMusic] = useState(null);
    const [exporting, setExporting] = useState(null);
    const [exportError, setExportError] = useState("");
    const [downloadedFile, setDownloadedFile] = useState(null);
    const abortRef = useRef(null);
    useEffect(() => {
        const saved = readSavedDetails();
        // carry over only the couple's names, date and venue — wording comes from the chosen design
        const base = saved?.brideName
            ? { ...DEMO_DETAILS, brideName: saved.brideName, groomName: saved.groomName, date: saved.date || DEMO_DETAILS.date, time: saved.time || DEMO_DETAILS.time, venue: saved.venue || DEMO_DETAILS.venue, city: saved.city || DEMO_DETAILS.city }
            : DEMO_DETAILS;
        const t = findReelTemplate(new URLSearchParams(window.location.search).get("reel"));
        if (t) {
            const td = reelDesign(t, Number(new URLSearchParams(window.location.search).get("cw") ?? t.colorway) || 0);
            setTpl(t);
            setKind(t.kind);
            setDesign(td);
            setDetails({ ...base, ...wordingFor(td) });
            setEvents(defaultJourney(t.journey ?? ["haldi", "mehndi", "sangeet", "wedding", "reception"], base.date, base.venue));
        }
        else {
            setDetails({ ...base, ...wordingFor(design) });
            setEvents(defaultJourney(["haldi", "mehndi", "sangeet", "wedding", "reception"], base.date, base.venue));
        }
    }, []);
    // share names/date with the card studio
    useEffect(() => {
        const id = setTimeout(() => {
            try {
                const raw = localStorage.getItem(DRAFT_KEY);
                const d = raw ? JSON.parse(raw) : {};
                localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, details: { ...(d.details ?? {}), brideName: details.brideName, groomName: details.groomName, date: details.date, time: details.time, venue: details.venue, city: details.city } }));
            }
            catch { /* storage blocked */ }
        }, 800);
        return () => clearTimeout(id);
    }, [details.brideName, details.groomName, details.date, details.time, details.venue, details.city]);
    const photoSrcs = useMemo(() => photos.map((p) => p.src), [photos]);
    const photoVersion = JSON.stringify(photoSrcs);
    useEffect(() => { setDownloadedFile(null); }, [photoVersion, musicChoice, songOffset, songFile]);
    const duration = reelDuration(kind, events.length, photos.length);
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (musicChoice === "none")
                    return setMusic(null);
                if (musicChoice === "upload") {
                    if (!songFile)
                        return setMusic(null);
                    const buf = await prepareUploadedMusic(songFile, songOffset, duration);
                    if (alive)
                        setMusic(buf);
                    return;
                }
                const style = musicChoice === "auto" ? (kind === "cinematic" || kind === "journey" ? "festive" : musicStyleFor(design.event)) : musicChoice;
                const buf = await generateMusic(style, duration);
                if (alive)
                    setMusic(buf);
            }
            catch {
                if (alive)
                    setMusic(null);
            }
        })();
        return () => { alive = false; };
    }, [musicChoice, songFile, songOffset, design.event, kind, duration]);
    const preset = EVENT_PRESETS[design.event];
    const currentDef = designOf(design);
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
        setDesign((d) => ({ ...designFromDef(def, 0), showPhoto: d.showPhoto, intro: d.intro }));
        setTpl(null);
        restart();
        invalidate();
    }
    const restart = () => { setPlaying(true); setRestartKey((k) => k + 1); };
    const invalidate = () => { setDownloadedFile(null); };
    const updateDetails = (k, v) => { setDetails((d) => ({ ...d, [k]: v })); invalidate(); };
    const updateDesign = (patch) => { setDesign((d) => ({ ...d, ...patch })); invalidate(); };
    function chooseKind(k) { setKind(k); setTpl(null); restart(); invalidate(); }
    function chooseEvent(k) {
        const prev = wordingFor(design);
        const next = EVENT_PRESETS[k];
        setDetails((d) => ({
            ...d,
            title: d.title === prev.title || !d.title ? next.title : d.title,
            hostLine: d.hostLine === prev.hostLine || !d.hostLine ? next.hostLine : d.hostLine,
            message: d.message === prev.message || !d.message ? next.message : d.message,
            blessing: d.blessing === prev.blessing || d.blessing === undefined ? wordingFor({ event: k, scene: designsFor(k)[0].id }).blessing : d.blessing,
        }));
        setDesign((d) => ({ ...designFromDef(designsFor(k)[0]), showPhoto: d.showPhoto }));
        restart();
        invalidate();
    }
    function toggleEvent(k, on) {
        setEvents((list) => {
            if (!on)
                return list.filter((e) => e.kind !== k);
            const added = defaultJourney([k], details.date, details.venue)[0];
            return EVENT_ORDER.flatMap((kk) => (kk === k ? [added] : list.filter((e) => e.kind === kk)));
        });
        invalidate();
    }
    const updateEvent = (k, patch) => { setEvents((list) => list.map((e) => (e.kind === k ? { ...e, ...patch } : e))); invalidate(); };
    async function addPhotos(files) {
        if (!files)
            return;
        const room = MAX_PHOTOS - photos.length;
        const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
        const srcs = await Promise.all(picked.map((f) => fileToDataUrl(f, 1080, 1920, 0.82)));
        setPhotos((p) => [...p, ...srcs.map((src) => ({ src }))]);
        restart();
        invalidate();
    }
    const input = useReelInput({ kind, design, details, events, photoSrcs });
    async function downloadVideo() {
        setExportError("");
        setDownloadedFile(null);
        setExporting(0);
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        let completed = false;
        try {
            const { exportReelVideo } = await import("@/lib/export-video");
            const { blob, ext } = await exportReelVideo(input, music, (p) => setExporting(p), { signal: ctrl.signal });
            const filename = `${details.brideName}-${details.groomName}-${kind}-reel.${ext}`.replace(/\s+/g, "-").toLowerCase();
            download(blob, filename);
            setDownloadedFile(new File([blob], filename, { type: blob.type || (ext === "mp4" ? "video/mp4" : "video/webm") }));
            setExporting(1);
            completed = true;
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
    const needs = REEL_KINDS[kind].needs;
    return (<main className="studio">
      <SiteHeader active="/reels"/>
      <section className="hero compact">
        <p className="eyebrow">{tpl ? "REEL TEMPLATE" : "REEL MAKER"}</p>
        <h1>{tpl ? <>{tpl.name}, <em>with your story.</em></> : <>Make your own <em>video reel.</em></>}</h1>
        <p>Fill in your details and the reel is generated automatically. Download it as a 9:16 MP4 for WhatsApp, Instagram Reels and Stories.</p>
        {tpl && <p className="template-banner">Started from the <b>{tpl.name}</b> reel template · <a href="/reels#reel-templates">Change template</a></p>}
      </section>

      <div className="studio-grid">
        <div className="studio-form">
          <section className="step">
            <header><span className="num">01</span><div><small>THE STORYLINE</small><h2>Reel style</h2></div></header>
            <div className="kind-grid">
              {Object.keys(REEL_KINDS).map((k) => (<button type="button" key={k} className={kind === k ? "on" : ""} onClick={() => chooseKind(k)} aria-pressed={kind === k}>
                  <b>{REEL_KINDS[k].label}</b><small>{REEL_KINDS[k].blurb}</small>
                </button>))}
            </div>
          </section>

          <section className="step">
            <header><span className="num">02</span><div><small>DESIGN WITH COLOUR OPTIONS</small><h2>Ceremony, design & colours</h2></div></header>
            <Segmented label="Ceremony" value={design.event} onChange={chooseEvent} options={EVENT_ORDER.map((k) => ({ id: k, label: EVENT_PRESETS[k].label }))}/>
            <div className="sub-label">{preset.label.toUpperCase()} DESIGNS</div>
            <div className="design-grid">
              {designsFor(design.event).map((d) => (<button type="button" key={d.id} className={`design-card ${currentDef.id === d.id ? "on" : ""}`} onClick={() => chooseDesign(d)} aria-pressed={currentDef.id === d.id}>
                  <Thumb cacheKey={`card:${d.id}:0:${details.brideName}:${details.groomName}:${details.date}`} make={cardThumbJob(designFromDef(d, 0), details)} alt={d.name}/>
                  <b>{d.name}</b>
                  <small>{traditionOf(d)}</small>
                </button>))}
            </div>
            <div className="sub-label">COLOUR OPTIONS FOR “{currentDef.name.toUpperCase()}”</div>
            <ColorwayDots size="lg" colorways={currentDef.colorways} value={colorwayIndex} onChange={(i) => updateDesign({ palette: { ...currentDef.colorways[i].palette } })}/>
            <div className="sub-label">FINE-TUNE ANY COLOUR</div>
            <div className="color-row">
              {COLOR_FIELDS.map((f) => (<label key={f.key}><input type="color" value={design.palette[f.key]} onChange={(e) => updateDesign({ palette: { ...design.palette, [f.key]: e.target.value } })}/><span>{f.label}</span></label>))}
            </div>
            <div className="sub-label">LAYOUT STYLE</div>
            <Segmented label="Layout style" value={design.composition ?? "classic"} onChange={(v) => updateDesign({ composition: v })} options={COMPOSITIONS}/>
            <div className="sub-label">BLESSING LINE AT THE TOP</div>
            <div className="blessing-row">
              <Segmented label="Blessing line" value={design.blessing ? "on" : "off"} onChange={(v) => updateDesign({ blessing: v === "on" })} options={[{ id: "on", label: "Show" }, { id: "off", label: "Hide" }]}/>
              {design.blessing && <input className="blessing-input" aria-label="Blessing text" maxLength={60} value={details.blessing ?? ""} onChange={(e) => updateDetails("blessing", e.target.value)} placeholder="॥ श्री गणेशाय नमः ॥"/>}
            </div>
            <div className="sub-label">LETTERING</div>
            <Segmented label="Lettering" value={design.fonts} onChange={(v) => updateDesign({ fonts: v })} options={Object.keys(FONT_PAIRS).map((k) => ({ id: k, label: FONT_PAIRS[k].label }))}/>
            <div className="sub-label">FLOATING DETAILS</div>
            <Segmented label="Particles" value={design.particles} onChange={(v) => updateDesign({ particles: v })} options={PARTICLES}/>
            {kind === "classic" && (<><div className="sub-label">OPENING</div><Segmented label="Opening" value={design.intro} onChange={(v) => { updateDesign({ intro: v }); restart(); }} options={INTROS}/></>)}
          </section>

          <section className="step">
            <header><span className="num">03</span><div><small>THE PEOPLE & THE PLAN</small><h2>Tell your story</h2></div></header>
            <div className="fields two">
              <label className="field">BRIDE<input maxLength={40} value={details.brideName} onChange={(e) => updateDetails("brideName", e.target.value)}/></label>
              <label className="field">GROOM<input maxLength={40} value={details.groomName} onChange={(e) => updateDetails("groomName", e.target.value)}/></label>
            </div>
            <label className="field">NAMES IN YOUR LANGUAGE (OPTIONAL)<input maxLength={40} value={details.nativeNames ?? ""} onChange={(e) => updateDetails("nativeNames", e.target.value)} placeholder="e.g. आरोही संग रेयांश"/></label>
            <div className="fields two">
              <label className="field">TITLE<input maxLength={30} value={details.title} onChange={(e) => updateDetails("title", e.target.value)}/></label>
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

          {needs === "photos" && (<section className="step">
              <header><span className="num">04</span><div><small>PHOTO STORY</small><h2>Your photos</h2></div></header>
              <p className="hint">Add up to {MAX_PHOTOS} photos. Each one gets about 3 seconds with a slow cinematic zoom and a caption. Portrait photos look best.</p>
              <input type="file" accept="image/*" multiple disabled={photos.length >= MAX_PHOTOS} onChange={(e) => { void addPhotos(e.target.files); e.currentTarget.value = ""; }}/>
              {photos.length > 0 && (<div className="photo-grid">
                  {photos.map((p, i) => (<div key={i} className="photo-item">
                      <img src={p.src} alt={`Photo ${i + 1}`}/>
                      <div className="photo-tools">
                        <button type="button" disabled={i === 0} onClick={() => setPhotos((list) => { const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} aria-label="Move earlier">←</button>
                        <button type="button" onClick={() => setPhotos((list) => list.filter((_, j) => j !== i))} aria-label="Remove photo">×</button>
                      </div>
                    </div>))}
                </div>)}
              {photos.length === 0 && <p className="hint small">Until you add photos, the preview uses sample scenes.</p>}
            </section>)}

          {needs === "events" && (<section className="step">
              <header><span className="num">04</span><div><small>WEDDING JOURNEY</small><h2>Your functions</h2></div></header>
              <p className="hint">Tick the functions to include. Each gets its own scene with date, time and venue.</p>
              <div className="events-list">
                {EVENT_ORDER.map((k) => {
                const ev = events.find((e) => e.kind === k);
                return (<div key={k} className={`event-row ${ev ? "on" : ""}`}>
                      <label className="check"><input type="checkbox" checked={!!ev} onChange={(e) => toggleEvent(k, e.target.checked)}/> <b>{EVENT_PRESETS[k].title}</b></label>
                      {ev && (<div className="event-fields">
                          <input type="date" value={ev.date} onChange={(e) => updateEvent(k, { date: e.target.value })} aria-label={`${EVENT_PRESETS[k].label} date`}/>
                          <input type="time" value={ev.time} onChange={(e) => updateEvent(k, { time: e.target.value })} aria-label={`${EVENT_PRESETS[k].label} time`}/>
                          <input value={ev.venue} maxLength={60} onChange={(e) => updateEvent(k, { venue: e.target.value })} placeholder="Venue" aria-label={`${EVENT_PRESETS[k].label} venue`}/>
                        </div>)}
                    </div>);
            })}
              </div>
            </section>)}

          <section className="step">
            <header><span className="num">{needs ? "05" : "04"}</span><div><small>SOUNDTRACK</small><h2>Music</h2></div></header>
            <Segmented label="Music" value={musicChoice} onChange={setMusicChoice} options={[{ id: "auto", label: "Auto" }, { id: "calm", label: "Soft santoor" }, { id: "festive", label: "Festive dhol" }, { id: "upload", label: "My song" }, { id: "none", label: "No music" }]}/>
            {musicChoice === "upload" && (<div className="fields two">
                <label className="field">SONG FILE (MP3/M4A)<input type="file" accept="audio/*" onChange={(e) => setSongFile(e.target.files?.[0] ?? null)}/></label>
                <label className="field">START FROM (SECONDS)<input type="number" min={0} max={600} value={songOffset} onChange={(e) => setSongOffset(Number(e.target.value) || 0)}/></label>
              </div>)}
            <p className="hint small">Built-in music is generated in your browser and free to use. Only upload songs you have the rights to share.</p>
          </section>
        </div>

        <aside className="studio-preview">
          <div className="preview-sticky">
            <p className="preview-label">LIVE PREVIEW · {REEL_KINDS[kind].label.toUpperCase()} · {Math.round(duration)}s</p>
            <div className="phone">
              <ReelCanvas kind={kind} design={design} details={details} events={events} photoSrcs={photoSrcs} playing={playing} restartKey={restartKey} music={music} muted={muted} className="invite-canvas"/>
            </div>
            <div className="preview-actions">
              <button type="button" onClick={restart}>↻ Replay</button>
              <button type="button" onClick={() => setPlaying((p) => !p)}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
              <button type="button" onClick={() => { setMuted((m) => !m); setRestartKey((k) => k + 1); }}>{muted ? "🔇 Sound off" : "🔊 Sound on"}</button>
            </div>
            <div className="download-box">
              {exporting !== null ? (<div className="progress"><div style={{ width: `${Math.round(exporting * 100)}%` }}/><span>Making your reel… {Math.round(exporting * 100)}%</span>{exporting < 1 && <button type="button" className="link" onClick={() => abortRef.current?.abort()}>Cancel</button>}</div>) : (<button type="button" className="primary" onClick={downloadVideo}>↓ Download reel (MP4, 9:16 HD)</button>)}
              {exportError && <p className="error">{exportError}</p>}
              {downloadedFile && exporting === null && <SocialShareActions key={`${downloadedFile.name}:${downloadedFile.lastModified}`} file={downloadedFile} type="invitation reel" />}
            </div>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </main>);
}
