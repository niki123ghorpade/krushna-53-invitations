"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Thumb, { reelThumbJob } from "@/components/Thumb";
import FilterPanel from "@/components/FilterPanel";
import PlanNav from "@/components/PlanNav";
import { reelPlan, validPlan } from "@/lib/plans";
import { ColorwayDots, SiteFooter, SiteHeader, readSavedDetails } from "@/components/ui";
import { findDesign, wordingFor } from "@/lib/designs";
import { DEMO_DETAILS, EVENT_ORDER, EVENT_PRESETS } from "@/lib/invite-design";
import { REEL_KINDS, REEL_TEMPLATES, defaultJourney, reelDesign, reelDuration, reelTradition } from "@/lib/reels";
const ReelCanvas = dynamic(() => import("@/components/ReelCanvas"), { ssr: false, loading: () => <div className="invite-canvas" aria-label="Loading reel preview"/> });
export default function ReelsPage() {
    const [details, setDetails] = useState(DEMO_DETAILS);
    const [tier, setTier] = useState("");
    const [tab, setTab] = useState("all");
    const [kind, setKind] = useState("all");
    const [colorways, setColorways] = useState({});
    const [preview, setPreview] = useState(null);
    useEffect(() => {
        const selectedTier = new URLSearchParams(window.location.search).get("tier");
        if (validPlan(selectedTier) && selectedTier !== "basic") setTier(selectedTier);
        const d = readSavedDetails();
        if (d?.brideName)
            setDetails(d);
        const e = new URLSearchParams(window.location.search).get("event");
        if (e && EVENT_ORDER.includes(e))
            setTab(e);
        const k = new URLSearchParams(window.location.search).get("kind");
        if (k && REEL_KINDS[k])
            setKind(k);
    }, []);
    const list = useMemo(() => REEL_TEMPLATES.filter((r) => (!tier || reelPlan(r) === tier) && (tab === "all" || (tab === "multi" ? r.kind === "journey" : r.event === tab && r.kind !== "journey")) && (kind === "all" || r.kind === kind)), [tab, kind, tier]);
    const cwOf = (r) => colorways[r.id] ?? r.colorway;
    const colorOptions = (r) => findDesign(r.design)?.colorways ?? [];
    const detailsFor = (r) => {
        return { ...details, ...wordingFor(reelDesign(r)), couplePhoto: undefined };
    };
    const seconds = (r) => Math.round(reelDuration(r.kind, r.journey?.length ?? 1, 3));
    const href = (r) => `/reels/create?reel=${r.id}&cw=${cwOf(r)}`;
    const kindsInTab = Object.keys(REEL_KINDS).filter((k) => (tab === "multi" ? k === "journey" : k !== "journey" || tab === "all"));
    return (<main className="studio">
      <SiteHeader active="/reels"/>
      <section className="hero compact">
        <p className="eyebrow">VIDEO REELS</p>
        <h1>{tier === "pro" ? <>Your complete <em>wedding journey.</em></> : <>A different reel for <em>every ceremony.</em></>}</h1>
        <p>Pick a card style and animation, then we build the reel from your names, date, venue and photos. Choose from cinematic reveals, stationery-inspired cards and celebration highlights.</p>
      </section>
      <PlanNav tier={tier} reels />

      <section className="choice-grid two-up reels-start" aria-label="How do you want to make your reel?">
        <a className="choice-card" href="/reels/create">
          <span className="choice-icon">✎</span>
          <b>Create a reel myself</b>
          <p>Start blank: choose the ceremony, design, colours, animation, music and photos yourself.</p>
          <span className="choice-cta">Open reel maker →</span>
        </a>
        <a className="choice-card featured" href="#reel-templates">
          <span className="choice-icon">✦</span>
          <b>Pick a reel template, we&rsquo;ll make it</b>
          <p>Choose one of {REEL_TEMPLATES.length} ready reels below, fill in your details, and the video is generated for you.</p>
          <span className="choice-cta">Browse reel templates ↓</span>
        </a>
      </section>

      <div className="gallery-wrap browse" id="reel-templates">
        <FilterPanel resultLabel={`${list.length} reel${list.length === 1 ? "" : "s"}`} groups={[
            { id: "tab", title: "Ceremony", value: tab, onChange: (v) => { setTab(v); if (v !== "multi" && kind === "journey")
                    setKind("all"); if (v === "multi")
                    setKind("all"); }, options: [{ id: "all", label: "All ceremonies" }, ...EVENT_ORDER.map((k) => ({ id: k, label: EVENT_PRESETS[k].label })), { id: "multi", label: "All functions (journey)" }] },
            { id: "kind", title: "Animation", value: kind, onChange: setKind, options: [{ id: "all", label: "All animations" }, ...kindsInTab.map((k) => ({ id: k, label: REEL_KINDS[k].label }))] },
        ]}/>
        <div className="browse-main">
        <div className="browse-top"><p className="count">{list.length} reel{list.length === 1 ? "" : "s"}</p></div>
        <div className="tpl-grid">
          {list.map((r) => (<article key={r.id} className="tpl-card">
              <button type="button" className="tpl-thumb" onClick={() => setPreview(r)} aria-label={`Preview ${r.name}`}>
                <Thumb cacheKey={`reel:${r.id}:${cwOf(r)}:${details.brideName}:${details.groomName}:${details.date}`} make={reelThumbJob({ ...r, colorway: cwOf(r) }, details)} alt={r.name}/>
                <span className="badge">▶ {REEL_KINDS[r.kind].label} · {seconds(r)}s</span>
              </button>
              <div className="tpl-meta">
                <b>{r.kind === "journey" ? r.name : findDesign(r.design)?.name}</b>
                <small>{r.kind === "journey" ? `${r.journey?.length} functions` : reelTradition(r) === "Pan-Indian" ? EVENT_PRESETS[r.event].label : `${reelTradition(r)} · ${findDesign(r.design)?.wording?.title}`} · {REEL_KINDS[r.kind].label}</small>
                <p className="hint small">{REEL_KINDS[r.kind].blurb}</p>
              </div>
              <ColorwayDots colorways={colorOptions(r)} value={cwOf(r)} onChange={(i) => setColorways((c) => ({ ...c, [r.id]: i }))}/>
              <div className="tpl-actions">
                <button type="button" onClick={() => setPreview(r)}>Preview</button>
                <a className="primary" href={href(r)}>Use this reel</a>
              </div>
            </article>))}
        </div>
        </div>
      </div>

      {preview && (<div className="modal" role="dialog" aria-modal="true" aria-label={`${preview.name} preview`} onClick={() => setPreview(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setPreview(null)} aria-label="Close">×</button>
            <div className="modal-canvas">
              <ReelCanvas key={`${preview.id}-${cwOf(preview)}`} kind={preview.kind} design={reelDesign(preview, cwOf(preview))} details={detailsFor(preview)} events={defaultJourney(preview.journey ?? [preview.event], details.date, details.venue)} photoSrcs={[]} playing muted className="invite-canvas"/>
            </div>
            <div className="modal-side">
              <small>{REEL_KINDS[preview.kind].label} · about {seconds(preview)} seconds</small>
              <h2>{preview.kind === "journey" ? preview.name : findDesign(preview.design)?.name}</h2>
              <p className="hint">{REEL_KINDS[preview.kind].blurb}</p>
              <div className="sub-label">COLOUR OPTIONS</div>
              <ColorwayDots size="lg" colorways={colorOptions(preview)} value={cwOf(preview)} onChange={(i) => setColorways((c) => ({ ...c, [preview.id]: i }))}/>
              {REEL_KINDS[preview.kind].needs === "photos" && <p className="hint small">This preview uses sample artwork. Your own photos replace it on the next screen.</p>}
              {REEL_KINDS[preview.kind].needs === "events" && <p className="hint small">You can choose which functions to include and set each one&rsquo;s date, time and venue.</p>}
              <a className="primary" href={href(preview)}>Use this reel</a>
            </div>
          </div>
        </div>)}
      <SiteFooter />
    </main>);
}
