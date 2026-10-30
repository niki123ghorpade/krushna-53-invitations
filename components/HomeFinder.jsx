"use client";
import { useEffect, useMemo, useState } from "react";
import Thumb, { cardThumbJob, photoFingerprint, reelThumbJob } from "@/components/Thumb";
// import TemplatePrice from "@/components/TemplatePrice"; // Temporarily hidden on the home finder.
import { EVENT_ORDER, EVENT_PRESETS } from "@/lib/invite-design";
import { REEL_KINDS, REEL_TEMPLATES } from "@/lib/reels";
import { CARD_TEMPLATES, readUserTemplateCards, templateDesign } from "@/lib/templates";
import { REGIONAL_CULTURES } from "@/lib/regional-templates";

const COLLECTIONS = [
    { id: "regional", label: "Regional" },
    { id: "couple", label: "Bride & groom" },
    { id: "popular", label: "Popular" },
    { id: "new", label: "New" },
];
const FORMATS = [{ id: "card", label: "Card" }, { id: "reel", label: "Reel" }];
const FEATURED = ["noir-foil", "ruby-engraving", "ivory-botanical", "haldi-rangoli", "mehndi-peacock", "sangeet-disco"];
const PREMIUM = ["noir-foil", "ruby-engraving", "ivory-botanical", "celestial-night", "pastel-garden", "royal-mandala"];
const SHOW = 6;

/** A native select dressed as an underlined word inside the sentence. */
function Pick({ label, field, value, onChange, options }) {
    return (<label className={`finder-pick ${field}`}>
      <span className="sr-only">{label}</span>
      <span className="finder-mobile-label" aria-hidden="true">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>);
}

function results(collection, event, culture, kind, userTemplates) {
    const byEvent = (t) => event === "all" || t.event === event;
    const cards = CARD_TEMPLATES;
    if (collection === "reels")
        return REEL_TEMPLATES.filter((r) => (event === "all" || r.event === event) && (kind === "all" || r.kind === kind));
    if (collection === "regional") {
        const list = cards.filter((t) => t.regional && byEvent(t) && (culture === "all" || t.tradition === culture));
        if (culture !== "all")
            return list;
        // one design per culture first, so "any culture" shows variety
        const seen = new Set();
        const first = list.filter((t) => !seen.has(t.tradition) && seen.add(t.tradition));
        return [...first, ...list.filter((t) => !first.includes(t))];
    }
    if (collection === "couple")
        return cards.filter((t) => t.style === "Couple" && byEvent(t) && (culture === "all" || t.tradition === culture));
    if (collection === "new") {
        const freshSince = Date.now() - 9 * 24 * 60 * 60 * 1000;
        const added = [...userTemplates].filter((t) => t.savedAt >= freshSince && byEvent(t)).sort((a, b) => b.savedAt - a.savedAt);
        const featuredNew = cards.filter((t) => (PREMIUM.includes(t.id) || t.coupleArt) && byEvent(t));
        return [...added, ...featuredNew.filter((t) => !added.some((saved) => saved.id === t.id))];
    }
    if (collection === "popular") {
        const added = [...userTemplates].sort((a, b) => b.savedAt - a.savedAt).filter(byEvent);
        const featuredPopular = cards.filter((t) => FEATURED.includes(t.id) && byEvent(t));
        return [...added, ...featuredPopular.filter((t) => !added.some((saved) => saved.id === t.id))];
    }
    const general = cards.filter((t) => !t.regional && byEvent(t));
    return [...general.filter((t) => FEATURED.includes(t.id)), ...general.filter((t) => !FEATURED.includes(t.id))];
}

export default function HomeFinder({ details }) {
    const [format, setFormat] = useState("card");
    const [collection, setCollection] = useState("regional");
    const [event, setEvent] = useState("wedding");
    const [culture, setCulture] = useState("all");
    const [kind, setKind] = useState("all");
    const [userTemplates, setUserTemplates] = useState([]);
    useEffect(() => {
        const refresh = () => setUserTemplates(readUserTemplateCards());
        refresh();
        window.addEventListener("storage", refresh);
        return () => window.removeEventListener("storage", refresh);
    }, []);
    const list = useMemo(() => {
        return results(format === "reel" ? "reels" : collection, event, culture, kind, userTemplates);
    }, [format, collection, event, culture, kind, userTemplates]);
    const shown = list.slice(0, SHOW);
    const isReel = format === "reel";
    const hasCulture = !isReel && (collection === "regional" || collection === "couple");
    const photoKey = photoFingerprint(details.couplePhoto);
    const allHref = isReel
        ? `/reels?${new URLSearchParams({ ...(event !== "all" && { event }), ...(kind !== "all" && { kind }) })}#reel-templates`
        : `/templates?${new URLSearchParams({ ...(event !== "all" && { event }), ...(collection === "regional" && { regional: "true" }), ...(hasCulture && culture !== "all" && { culture }), ...(collection === "couple" && { style: "Couple" }) })}`;
    const eventOptions = [{ id: "all", label: "any ceremony" }, ...EVENT_ORDER.map((k) => ({ id: k, label: EVENT_PRESETS[k].label }))];
    const cultureOptions = [{ id: "all", label: "any culture" }, ...REGIONAL_CULTURES.filter((c) => collection === "regional" || CARD_TEMPLATES.some((t) => t.style === "Couple" && t.tradition === c.id)).map((c) => ({ id: c.id, label: c.label }))];
    const kindOptions = [{ id: "all", label: "any" }, ...Object.keys(REEL_KINDS).map((k) => ({ id: k, label: REEL_KINDS[k].label }))];
    const pickCollection = (c) => { setCollection(c); setCulture("all"); setKind("all"); };
    return (<section className="finder" aria-labelledby="finder-title">
      <div className="finder-inner">
        <div className="finder-controls">
          <h2 id="finder-title">Find your <em>perfect design</em></h2>
          <p className="finder-sub">Fill the line and see matching designs.</p>
          <form className="finder-form" onSubmit={(e) => { e.preventDefault(); window.location.href = allHref; }}>
          <p className="finder-sentence">
            <span className="finder-lead">Show me</span>
            <Pick label="Invitation format" field="format" value={format} onChange={setFormat} options={FORMATS}/>
            {!isReel && <><span className="finder-connector">with</span><Pick label="Collection" field="collection" value={collection} onChange={pickCollection} options={COLLECTIONS}/></>}
            <span className="finder-connector">{isReel ? "for" : "designs for"}</span>
            <Pick label="Ceremony" field="ceremony" value={event} onChange={setEvent} options={eventOptions}/>
            {hasCulture && <><span className="finder-connector">in</span><Pick label="Regional style" field="culture" value={culture} onChange={setCulture} options={cultureOptions}/><span className="finder-connector">style</span></>}
            {isReel && <><span className="finder-connector">with</span><Pick label="Animation" field="animation" value={kind} onChange={setKind} options={kindOptions}/><span className="finder-connector">animation</span></>}
          </p>
          <button type="submit" className="finder-go">Show designs →</button>
          </form>
        </div>

        {shown.length ? (<div className="finder-grid">
            {shown.map((t) => isReel ? (<a key={t.id} className="mini-card" href={`/reels/create?reel=${t.id}`}>
                <Thumb cacheKey={`reel:${t.id}:${details.brideName}:${details.groomName}:${details.date}`} make={reelThumbJob(t, details)} alt={t.name}/>
                <span className="badge">▶ {REEL_KINDS[t.kind].label}</span>
                <b>{t.name.split(" · ").pop()}</b>
                {/* <TemplatePrice template={t} reel /> */}
                <small>{EVENT_PRESETS[t.event]?.label} · reel</small>
              </a>) : (<a key={t.id} className="mini-card" href={`/create?template=${t.id}`}>
                <Thumb cacheKey={`card:${t.id}:0:${photoKey}:${details.brideName}:${details.groomName}:${details.date}`} make={cardThumbJob(templateDesign(t), details)} alt={t.name}/>
                <span className="badge">{t.regional ? t.tradition : t.style === "Couple" ? "✦ Bride & groom" : collection === "new" ? "New" : collection === "popular" && t.userSaved ? "Popular" : t.style}</span>
                <b>{t.regional ? t.regionLabel : t.name}</b>
                {/* <TemplatePrice template={t} /> */}
                <small>{t.regional ? `${t.name.split(" · ").pop()} · ` : `${EVENT_PRESETS[t.event]?.label} · `}{t.def.colorways.length} colours</small>
              </a>))}
          </div>) : (<p className="finder-empty">No designs match yet. Try “any ceremony” or another style.</p>)}
        {list.length > shown.length && <div className="finder-more"><a href={allHref}>View all {list.length} →</a></div>}
      </div>
    </section>);
}

