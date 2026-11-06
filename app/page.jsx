"use client";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader, readSavedDetails } from "@/components/ui";
import HomeWeddingWebsitePromo from "@/components/HomeWeddingWebsitePromo";
import HomeFAQ from "@/components/HomeFAQ";
import PricingCustomise from "@/components/PricingCustomise";
import { DEMO_DETAILS } from "@/lib/invite-design";

const steps = [
  ["01", "Choose a design", "Browse card and reel templates for your celebration."],
  ["02", "Add your details", "Personalise names, dates, venue and ceremony information."],
  ["03", "Make it yours", "Adjust the look and preview your invitation as you go."],
  ["04", "Download & share", "Export a card as PNG or PDF, or a reel as MP4."],
];
const features = [
  ["∞", "Share with unlimited guests", "Plan a shareable wedding website link for your family and friends."],
  ["⌁", "Edits until your event date", "Discuss updates to your wedding details as plans come together."],
  ["scratch", "Scratch to reveal the date", "Add a playful scratch-card moment to reveal your celebration date."],
  ["◷", "Live countdown", "Build anticipation with a countdown to your special day."],
  ["♫", "Background music", "Set the mood with music and a guest-friendly mute control."],
  ["venue", "Venue with maps", "Help guests find the venue with map and directions details."],
  ["upload", "Custom image upload", "Personalise the page with photos and a custom hero background."],
  ["customize", "Full customization", "Shape the page around your events, dress code, sections and story."],
];
const celebrations = ["Wedding", "Engagement", "Haldi", "Mehndi", "Sangeet", "Reception"];
const invitationComparison = [
  ["Delivery Time", "2–4 weeks", "Instant download"],
  ["Interactive Features", false, true],
  ["Editable After Sending", false, true],
  ["Background Music", false, true],
  ["Google Maps Integration", false, true],
  ["Eco-Friendly", false, true],
  ["Shareable via Link", false, true],
];

function FeatureIcon({ name }) {
  const drawings = {
    scratch: <><path d="M8.2 11.3V6.2a1.5 1.5 0 0 1 3 0v4.1-6a1.5 1.5 0 0 1 3 0v6.2-4.2a1.5 1.5 0 0 1 3 0v5.2-2.1a1.5 1.5 0 0 1 3 0v5.4c0 3.1-2.1 5.2-5.1 5.2h-2.8c-1.5 0-2.7-.7-3.6-1.9l-3.2-4.3a1.7 1.7 0 0 1 2.5-2.3l2.2 2.1"/><path d="M4.2 7.1 6 5.7M3.2 11h2M5 3.4l1.3 1.8"/></>,
    inbox: <><path d="m3 10 2.1-5h13.8L21 10v9H3z"/><path d="M3 11h5l1.5 2h5L16 11h5"/></>,
    music: <><path d="M14 17V4l6-1v13"/><circle cx="11" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></>,
    venue: <><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/><path d="M8 17h8"/></>,
    animations: <><path d="m4 20 10.8-10.8a2.1 2.1 0 0 0-3-3L1 17v3z"/><path d="m14 4 1-2m4 5 2-1m-1 5 2 1M6 5 5 3"/><path d="m16 14 .7 1.7L18.5 16l-1.8.7L16 18.5l-.7-1.8-1.8-.7 1.8-.3z"/></>,
    upload: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 2-2 6 5M18 2v5m-2.5-2.5h5"/></>,
    customize: <><path d="m14.5 5.5 4 4M3 21l4.5-1 11.2-11.2a2.8 2.8 0 0 0-4-4L3.5 17z"/><path d="m3 21 1-4"/></>,
  };
  return <svg className="landing-scratch-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">{drawings[name]}</svg>;
}

export default function Home() {
  const [details, setDetails] = useState(DEMO_DETAILS);
  useEffect(() => { const saved = readSavedDetails(); if (saved?.brideName) setDetails(saved); }, []);

  return <main className="studio home-page">
    <SiteHeader active="/" />
    <section className="hero home-hero landing-hero">
      <div className="landing-hero-inner">
        <p className="eyebrow landing-hero-eyebrow">INVITATIONS FOR EVERY MOMENT</p>
        <h1>Every ceremony, <em>beautifully invited.</em></h1>
        <p className="landing-hero-copy">Create a wedding invitation that feels like you — from the first card to every celebration in your journey.</p>
        <div className="landing-hero-actions"><a className="primary" href="/templates">Find your design <span aria-hidden="true">→</span></a><a className="landing-secondary" href="/reels/create">Create your reel <span aria-hidden="true">↗</span></a></div>
        <div className="landing-proof" aria-label="Cards, video reels, wedding journeys, PNG, PDF and MP4 downloads">
          <span className="landing-proof-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 2-2 6 5"/></svg><span>Cards</span></span>
          <span className="landing-proof-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/></svg><span>Video reels</span></span>
          <span className="landing-proof-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="12" r="6.5"/><circle cx="15" cy="12" r="6.5"/></svg><span>Wedding journeys</span></span>
          <span className="landing-proof-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v6h5M9 14h7m-7 3h7"/></svg><span>PNG · PDF · MP4 downloads</span></span>
        </div>
      </div>
      <a className="landing-scroll" href="#celebration-categories" aria-label="Explore celebrations">EXPLORE <svg viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="m2 3 7 7 7-7"/></svg></a>
    </section>

    <section className="landing-categories" id="celebration-categories" aria-labelledby="landing-categories-title">
      <div className="landing-category-window">
        <div className="landing-category-windowbar" aria-hidden="true"><span className="landing-window-dots"><i /><i /><i /></span><span>EVERYMOMENT · INVITATIONS</span></div>
        <div className="landing-category-content">
          <p className="eyebrow">INVITATIONS FOR EVERY OCCASION</p>
          <h2 id="landing-categories-title">One beautiful invitation for <em>every celebration.</em></h2>
          <p>Choose your occasion to explore designs made for the moments you want to share.</p>
          <div className="landing-category-pills">{celebrations.map((name) => <a href={`/templates?event=${encodeURIComponent(name.toLowerCase())}&regional=true`} key={name}>{name}<span aria-hidden="true">↗</span></a>)}</div>
        </div>
      </div>
    </section>

    <section className="landing-intro" id="how-it-works">
      <div className="landing-intro-copy"><p className="eyebrow">A SIMPLE PROCESS</p><h2>From your idea to <em>the big day.</em></h2><p>Everything you need to create an invitation that brings your people together.</p><a className="landing-text-link" href="/templates">Explore all designs <span aria-hidden="true">→</span></a></div>
      <div className="landing-steps">{steps.map(([number, title, copy]) => <article className="landing-step" key={number}><span className="landing-step-number">{number}</span><div><h3>{title}</h3><p>{copy}</p></div><span className="landing-step-arrow" aria-hidden="true">↗</span></article>)}</div>
    </section>

    <section className="landing-features" aria-labelledby="landing-features-title">
      <div className="landing-features-heading">
        <p className="eyebrow">EVERYTHING YOU NEED</p>
        <h2 id="landing-features-title">Premium features</h2>
        <p>Explore the interactive details you can discuss for your custom wedding website.</p>
        <span className="landing-features-rule" aria-hidden="true" />
        <small>Custom website features and availability are confirmed with you before a proposal.</small>
      </div>
      <div className="landing-feature-grid">{features.map(([icon, title, copy], index) => <article className="landing-feature" key={title}><span className="landing-feature-icon" aria-hidden="true">{icon in { scratch: 1, inbox: 1, music: 1, venue: 1, animations: 1, upload: 1, customize: 1 } ? <FeatureIcon name={icon}/> : icon}</span><div className="landing-feature-copy"><h3>{title}</h3><p>{copy}</p></div><span className="landing-feature-index">0{index + 1}</span></article>)}</div>
    </section>

    <section className="landing-comparison" aria-labelledby="landing-comparison-title">
      <div className="landing-comparison-heading"><p className="eyebrow">WHY GO DIGITAL?</p><h2 id="landing-comparison-title">Paper vs Digital Invitations</h2><span aria-hidden="true" /></div>
      <div className="landing-compare-scroll"><table className="landing-compare-table"><thead><tr><th scope="col">Feature</th><th scope="col">Paper</th><th scope="col">Digital</th></tr></thead><tbody>{invitationComparison.map(([feature, paper, digital]) => <tr key={feature}><th scope="row">{feature}</th><td>{typeof paper === "boolean" ? <span className={`landing-compare-mark${paper ? " is-yes" : " is-no"}`} aria-label={paper ? "Included" : "Not included"}>{paper ? "✓" : "×"}</span> : paper}</td><td>{typeof digital === "boolean" ? <span className={`landing-compare-mark${digital ? " is-yes" : " is-no"}`} aria-label={digital ? "Included" : "Not included"}>{digital ? "✓" : "×"}</span> : digital}</td></tr>)}</tbody></table></div>
    </section>

    <section className="landing-pricing landing-custom-only" id="pricing"><PricingCustomise /></section>

    <HomeFAQ />
    <HomeWeddingWebsitePromo />
    <section className="home-final-cta" aria-labelledby="home-final-cta-title">
      <span className="home-final-cta-heart" aria-hidden="true">♡</span>
      <h2 id="home-final-cta-title">Ready to create your <em>perfect invitation?</em></h2>
      <p>Start with an invitation or explore a custom wedding website for your celebration.</p>
      <div className="home-final-cta-actions">
        <a className="home-final-cta-primary" href="/create">Create my own <span aria-hidden="true">→</span></a>
        <a className="home-final-cta-secondary" href="/wedding-websites">Create website <span aria-hidden="true">↗</span></a>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
