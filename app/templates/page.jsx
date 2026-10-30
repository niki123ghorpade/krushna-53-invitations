"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Thumb, { cardThumbJob, photoFingerprint } from "@/components/Thumb";
import FilterPanel from "@/components/FilterPanel";
import PlanNav from "@/components/PlanNav";
// import TemplatePrice from "@/components/TemplatePrice"; // Temporarily hidden on the templates page.
import { PLANS, cardPlan, validPlan } from "@/lib/plans";
import { ColorwayDots, SiteFooter, SiteHeader, readSavedDetails } from "@/components/ui";
import { DEMO_DETAILS, EVENT_ORDER, EVENT_PRESETS } from "@/lib/invite-design";
import { wordingFor } from "@/lib/designs";
import { REGIONAL_CULTURES } from "@/lib/regional-templates";
import { CARD_TEMPLATES, readUserTemplateCards, templateDesign } from "@/lib/templates";
const InviteCanvas = dynamic(() => import("@/components/InviteCanvas"), { ssr: false, loading: () => <div className="invite-canvas" aria-label="Loading preview"/> });
export default function TemplatesPage() {
    const [details, setDetails] = useState(DEMO_DETAILS);
    const [tier, setTier] = useState("");
    const [event, setEvent] = useState("all");
    const [culture, setCulture] = useState("all");
    const [style, setStyle] = useState("all");
    const [regionalOnly, setRegionalOnly] = useState(false);
    const [colorways, setColorways] = useState({});
    const [preview, setPreview] = useState(null);
    const [userTemplates, setUserTemplates] = useState([]);
    const [savedNotice, setSavedNotice] = useState("");
    useEffect(() => {
        const selectedTier = new URLSearchParams(window.location.search).get("tier");
        if (validPlan(selectedTier)) setTier(selectedTier);
        setUserTemplates(readUserTemplateCards());
        try {
            const savedName = sessionStorage.getItem("krushna53-template-saved-notice");
            if (savedName) {
                setSavedNotice(`“${savedName}” was added to Templates.`);
                sessionStorage.removeItem("krushna53-template-saved-notice");
            }
        }
        catch { /* session storage may be unavailable */ }
        const d = readSavedDetails();
        if (d?.brideName)
            setDetails(d);
        const e = new URLSearchParams(window.location.search).get("event");
        if (e && EVENT_ORDER.includes(e))
            setEvent(e);
        const savedCulture = new URLSearchParams(window.location.search).get("culture");
        if (savedCulture && REGIONAL_CULTURES.some((item) => item.id === savedCulture))
            setCulture(savedCulture);
        const savedStyle = new URLSearchParams(window.location.search).get("style");
        if (savedStyle && ["Couple", "Royal", "Floral", "Festive", "Modern"].includes(savedStyle))
            setStyle(savedStyle);
        setRegionalOnly(new URLSearchParams(window.location.search).get("regional") === "true");
    }, []);
    const list = useMemo(
        () => [...CARD_TEMPLATES, ...userTemplates].filter((t) =>
            (!tier || cardPlan(t) === tier) &&
            (event === "all" || t.event === event) &&
            (style === "all" || t.style === style) &&
            (!regionalOnly || t.regional) &&
            (culture === "all" || t.tradition === culture)
        ),
        [event, style, culture, userTemplates, tier, regionalOnly]
    );
    const cwOf = (t) => colorways[t.id] ?? 0;
    const setCw = (t, i) => setColorways((c) => ({ ...c, [t.id]: i }));
    const detailsFor = (t) => {
        return { ...details, ...(t.savedWording ?? wordingFor(templateDesign(t))) };
    };
    const photoKey = photoFingerprint(details.couplePhoto);
    const useHref = (t) => `/create?template=${t.id}&cw=${cwOf(t)}${tier ? `&tier=${tier}&mode=${tier === "basic" ? "card" : "video"}` : ""}`;
    const plan = PLANS.find((p) => p.id === tier);
    return (<main className="studio">
      <SiteHeader active="/templates"/>
      <section className="hero compact">
        <p className="eyebrow">{plan ? `${plan.name.toUpperCase()} COLLECTION` : "CARD TEMPLATES"}</p>
        <h1>{plan ? <>{plan.name} <em>invitations.</em></> : <>Wedding cards with <em>a more considered finish.</em></>}</h1>
        <p>{plan?.description ?? "Choose an illustrated design, then make it yours with your names, date, venue and colours."}</p>
        <a className="primary" href={tier === "basic" ? "/create?tier=basic&mode=card&artwork=upload#artwork" : "/create#save-template"}>{tier === "basic" ? "Add your own design →" : "Create and save your own template →"}</a>
        {tier && tier !== "basic" && <a className="primary" href={`/reels?tier=${tier}`}>{tier === "pro" ? "Explore wedding journeys →" : "Explore video reels →"}</a>}
      </section>
      <PlanNav tier={tier} />

      <div className="gallery-wrap browse">
        <FilterPanel resultLabel={`${list.length} design${list.length === 1 ? "" : "s"}`} groups={[
            { id: "style", title: "Collection", value: style, onChange: setStyle, options: [{ id: "all", label: "All designs" }, ...(CARD_TEMPLATES.some((t) => t.style === "Couple") ? [{ id: "Couple", label: "Bride & groom ✦" }] : []), { id: "Royal", label: "Royal" }, { id: "Floral", label: "Floral" }, { id: "Festive", label: "Festive" }, { id: "Modern", label: "Modern" }] },
            { id: "event", title: "Ceremony", value: event, onChange: setEvent, options: [{ id: "all", label: "All ceremonies" }, ...EVENT_ORDER.map((k) => ({ id: k, label: EVENT_PRESETS[k].label }))] },
            { id: "culture", title: "Culture & regional style", value: culture, onChange: setCulture, options: [{ id: "all", label: "All designs" }, ...REGIONAL_CULTURES.map((item) => ({ id: item.id, label: item.label }))] },
        ]}/>
        <div className="browse-main">
        <div className="browse-top">
          <p className="count">{list.length} design{list.length === 1 ? "" : "s"} · {list.reduce((n, t) => n + t.def.colorways.length, 0)} colour options</p>
        </div>

        {savedNotice && <p className="hint small" role="status">{savedNotice}</p>}

        {list.length === 0 ? (<div className="tpl-empty">
          <p>No templates match these filters.</p>
          <a className="primary" href="/create#save-template">Create a template →</a>
        </div>) : (<div className="tpl-grid">
          {tier === "basic" && <article className="tpl-card add-own-card"><a className="add-own-template" href="/create?tier=basic&mode=card&artwork=upload#artwork"><span aria-hidden="true">＋</span><b>Add your own</b><p>Upload your artwork and personalise your simple invitation.</p></a><div className="tpl-meta"><b>Your own design</b>{/* <TemplatePrice template={{ userSaved: true }} /> */}<small>Basic digital invitation</small><p className="hint small">Start from your own artwork</p></div><div className="cw-placeholder" aria-hidden="true"/><div className="tpl-actions"><button type="button" onClick={() => window.location.assign("/create?tier=basic&mode=card&artwork=upload#artwork")}>Preview</button><a className="primary" href="/create?tier=basic&mode=card&artwork=upload#artwork">Upload design</a></div></article>}
          {list.map((t) => (<article key={t.id} className="tpl-card">
              <button type="button" className="tpl-thumb" onClick={() => setPreview(t)} aria-label={`Preview ${t.name}`}>
                <Thumb cacheKey={`card:${t.id}:${cwOf(t)}:${photoKey}:${details.brideName}:${details.groomName}:${details.date}`} make={cardThumbJob(templateDesign(t, cwOf(t)), details)} alt={`${t.name}, ${t.def.colorways[cwOf(t)].name}`}/>
                <span className="badge">{tier === "basic" ? "Simple card" : "▶ Animated"}</span>
              </button>
              <div className="tpl-meta">
                <b>{t.name}</b>
                {/* <TemplatePrice template={t} /> */}
                <small>{t.regional ? `${t.regionLabel} · ` : ""}{EVENT_PRESETS[t.event].label} · {t.def.colorways[cwOf(t)].name}</small>
                <p className="hint small">{t.blurb}</p>
              </div>
              <ColorwayDots colorways={t.def.colorways} value={cwOf(t)} onChange={(i) => setCw(t, i)}/>
              <div className="tpl-actions">
                <button type="button" onClick={() => setPreview(t)}>Preview</button>
                <a className="primary" href={useHref(t)}>Use design</a>
              </div>
            </article>))}
        </div>)}
        </div>
      </div>

      {preview && (<div className="modal" role="dialog" aria-modal="true" aria-label={`${preview.name} preview`} onClick={() => setPreview(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setPreview(null)} aria-label="Close">×</button>
            <div className="modal-canvas"><InviteCanvas design={templateDesign(preview, cwOf(preview))} details={detailsFor(preview)} mode={tier === "basic" ? "card" : "video"} playing={tier !== "basic"} restartKey={cwOf(preview)} muted className="invite-canvas"/></div>
            <div className="modal-side">
              <small>{preview.regional ? `${preview.regionLabel} · ` : ""}{EVENT_PRESETS[preview.event].label} · {preview.def.colorways[cwOf(preview)].name}</small>
              <h2>{preview.name}</h2>
              {/* <TemplatePrice template={preview} /> */}
              <p className="hint">{preview.blurb}</p>
              <div className="sub-label">COLOUR OPTIONS</div>
              <ColorwayDots size="lg" colorways={preview.def.colorways} value={cwOf(preview)} onChange={(i) => setCw(preview, i)}/>
              <p className="hint small">You can fine-tune every colour, the frame and the lettering on the next screen.</p>
              <a className="primary" href={useHref(preview)}>Use design</a>
            </div>
          </div>
        </div>)}
      <SiteFooter />
    </main>);
}
