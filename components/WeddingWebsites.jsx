"use client";
import { useEffect, useState } from "react";
import { SiteHeader, WhatsAppLink } from "@/components/ui";

const designs = [
  { name: "The Garden Vows", style: "Romantic garden", theme: "garden", initials: "A & R", date: "14 · 02 · 2027", note: "A love in full bloom" },
  { name: "Golden Hour", style: "Modern elegant", theme: "golden", initials: "M + K", date: "28 · 11 · 2026", note: "Together, always" },
  { name: "A Royal Affair", style: "Regal Indian", theme: "royal", initials: "S ♥ V", date: "06 · 12 · 2026", note: "Two families, one forever" },
  { name: "Coastal Promise", style: "Coastal minimal", theme: "coastal", initials: "I & N", date: "09 · 01 · 2027", note: "Meet us by the sea" },
  { name: "Petals & Poetry", style: "Soft floral", theme: "petals", initials: "P + A", date: "21 · 02 · 2027", note: "Our favourite chapter" },
  { name: "The Heirloom", style: "Heritage classic", theme: "heirloom", initials: "R ♥ D", date: "18 · 04 · 2027", note: "A celebration of us" },
];

const steps = [
  ["Share requirements", "Tell us your ideas, style and what you need."],
  ["Review the proposal", "We’ll share the proposal for you to review."],
  ["Approve the design", "Review the look and approve the design."],
  ["Provide details", "Share your wedding details, photos and special requests."],
  ["Make the website live", "We set it up and launch your wedding website."],
];

const faqs = [
  ["Can I customise the design to match our wedding?", "Yes. We’ll shape the colours, typography, sections and overall look around your celebration and the style you share with us."],
  ["What content can we include?", "You can share your names, story, schedule, venue details, photos and any special notes for guests. We’ll confirm the content during the proposal."],
  ["Can we request revisions?", "Yes. You’ll review the proposal and design before launch, and we’ll agree the revision scope with you up front."],
  ["Is hosting included?", "Hosting and the website address will be outlined in your proposal, so you can review those details before approving."],
  ["How long does delivery take?", "Timing depends on the design and how quickly details are ready. We’ll share an estimated schedule in the proposal."],
];

function DesignPreview({ design, index, onClick }) {
  return <button type="button" className={`wedding-design wedding-design-${design.theme}`} onClick={onClick} aria-label={`Open the ${design.name} wedding website demo`}>
    <div className="wedding-screen">
      <div className="wedding-screen-nav">{design.note}<span>THE WEDDING</span></div>
      <div className="wedding-screen-center">
        <span className="wedding-screen-kicker">WITH JOY IN OUR HEARTS</span>
        <strong>{design.name}</strong>
        <span className="wedding-screen-rule">✦</span>
        <span className="wedding-screen-date">{design.date}</span>
        <span className="wedding-screen-invite">WE’RE GETTING MARRIED</span>
      </div>
      <div className="wedding-screen-bottom">SCROLL TO EXPLORE <span>↓</span></div>
    </div>
    <div className="wedding-design-caption"><span>{design.style}</span><small>0{index + 1}</small><h3>{design.name}</h3></div>
    <span className="wedding-preview-action">View live-style demo <b>↗</b></span>
  </button>;
}

function WeddingDemoPlayer({ design, onClose }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const duration = 20;
  const scenes = ["The invitation", "Their story", "The celebration", "RSVP with ease"];
  const scene = Math.min(Math.floor(elapsed / 5), scenes.length - 1);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setElapsed((time) => {
        if (time >= duration - 1) {
          setPlaying(false);
          return duration;
        }
        return time + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  return <div className="wedding-demo-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`wedding-video-modal wedding-design-${design.theme}`} role="dialog" aria-modal="true" aria-labelledby="wedding-video-title">
      <header className="wedding-demo-toolbar"><span>{design.name}<small> · WEBSITE PREVIEW</small></span><button type="button" onClick={onClose} aria-label="Close demo">×</button></header>
      <div className={`wedding-video-screen wedding-video-scene-${scene}`}>
        <div className="wedding-video-site-nav"><span>{design.name}</span><div>OUR STORY&nbsp;&nbsp; THE CELEBRATION&nbsp;&nbsp; TRAVEL</div><b>RSVP</b></div>
        {scene === 0 && <div className="wedding-video-cover"><small>TOGETHER WITH OUR FAMILIES</small><h2 id="wedding-video-title">{design.name}</h2><span>ARE GETTING MARRIED</span><b>{design.date.replaceAll(" · ", "  /  ")}</b><em>SCROLL TO DISCOVER ↓</em></div>}
        {scene === 1 && <div className="wedding-video-story"><span className="wedding-video-flower">✿</span><small>A NOTE FROM US</small><h2>{design.note}</h2><p>Some moments are even more special when shared. We can’t wait to celebrate this new chapter with our favourite people by our side.</p><b>{design.name}</b></div>}
        {scene === 2 && <div className="wedding-video-events"><small>SAVE THE DATE</small><h2>The celebration</h2><div><article><span>THE CEREMONY</span><b>Saturday · 4:00 PM</b><p>Garden Pavilion<br/>Jaipur, India</p></article><article><span>DINNER &amp; DANCING</span><b>Saturday · 7:00 PM</b><p>The Courtyard<br/>Jaipur, India</p></article></div></div>}
        {scene === 3 && <div className="wedding-video-rsvp"><small>WE HOPE YOU CAN JOIN US</small><h2>Save your seat</h2><p>A simple, personal RSVP for the people you love.</p><b>WE CAN’T WAIT TO CELEBRATE WITH YOU</b></div>}
      </div>
      <div className="wedding-video-controls"><button type="button" onClick={() => { if (elapsed >= duration) setElapsed(0); setPlaying((value) => !value); }} aria-label={playing ? "Pause demo video" : elapsed >= duration ? "Replay demo video" : "Play demo video"}>{playing ? "Ⅱ" : elapsed >= duration ? "↻" : "▶"}</button><span>{scenes[scene]}</span><input aria-label="Demo video progress" type="range" min="0" max={duration} value={elapsed} onChange={(event) => { setElapsed(Number(event.target.value)); setPlaying(false); }}/><time>{`0:${String(elapsed).padStart(2, "0")} / 0:${duration}`}</time></div>
      <p className="wedding-video-caption">A sample walkthrough — your wedding website can be tailored to your story.</p>
    </section>
  </div>;
}

export default function WeddingWebsitesPage() {
  const [activeDemo, setActiveDemo] = useState(null);
  return <main className="studio wedding-sites-page">
    <SiteHeader active="/wedding-websites" />
    <section className="wedding-hero">
      <div className="wedding-hero-copy">
        <p className="eyebrow">A LITTLE HOME FOR YOUR BIG DAY</p>
        <h1>Your Wedding, Your Story <em>— A Website Made for You</em></h1>
        <p>Bring every detail of your celebration together in one thoughtful, personal place. Designed around the two of you and made easy to share with everyone you love.</p>
        <div className="wedding-hero-links">
          <a className="wedding-hero-link" href="#designs">Explore design ideas <span>↓</span></a>
          <a className="wedding-hero-link" href="/wedding-websites/demo">See a live demo <span>↗</span></a>
          <a className="wedding-hero-link" href="/wedding-websites/demo-card">Card-style demo <span>↗</span></a>
          <a className="wedding-hero-link" href="/wedding-websites/demo-garden">Envelope demo <span>↗</span></a>
        </div>
      </div>
      <div className="wedding-hero-art" aria-label="Illustrated wedding website preview">
        <div className="wedding-hero-orbit orbit-one"/><div className="wedding-hero-orbit orbit-two"/>
        <div className="wedding-hero-note"><small>THE BEGINNING OF</small><strong>Always</strong><span>EST. WITH LOVE</span></div>
        <span className="wedding-hero-flower flower-one">✿</span><span className="wedding-hero-flower flower-two">✿</span>
        <div className="wedding-hero-stamp">MADE<br/>FOR YOU</div>
      </div>
    </section>

    <section className="wedding-designs-section" id="designs" aria-labelledby="wedding-designs-title">
      <div className="wedding-section-heading"><p className="eyebrow">A FEW WAYS TO TELL YOUR STORY</p><h2 id="wedding-designs-title">Find a feeling that <em>feels like you.</em></h2><p>Every celebration is different. These are just a few starting points for your own one-of-a-kind wedding website.</p></div>
      <div className="wedding-designs-grid">{designs.map((design, index) => <DesignPreview key={design.name} design={design} index={index} onClick={() => setActiveDemo(design)}/>)}</div>
      <p className="wedding-gallery-note">Every website is tailored to your story. Your final design may look different from these examples.</p>
    </section>

    <section className="wedding-process" aria-labelledby="wedding-process-title">
      <div className="wedding-section-heading"><p className="eyebrow">FROM FIRST HELLO TO “IT’S LIVE”</p><h2 id="wedding-process-title">How it works?</h2><p>Your wedding website, from idea to a beautiful launch — in just 5 easy steps.</p></div>
      <div className="wedding-steps">{steps.map(([title, description], index) => <article className="wedding-step" key={title}><div className="wedding-step-illustration" aria-hidden="true"><span>{["☏", "▤", "▧", "♡", "∞"][index]}</span></div><div className="wedding-step-number">{index + 1}</div><h3>{title}</h3><p>{description}</p></article>)}</div>
    </section>

    <section className="wedding-faq" aria-labelledby="wedding-faq-title"><div className="wedding-faq-intro"><p className="eyebrow">WEDDING WEBSITE FAQs</p><h2 id="wedding-faq-title">A few things you might be wondering.</h2><p>Every detail is discussed before we begin, so you know what to expect at every step.</p></div><div className="wedding-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}</div></section>
    <section className="wedding-contact"><p className="eyebrow">LET’S MAKE SOMETHING MEANINGFUL</p><h2>Your story deserves a place <em>of its own.</em></h2><p>Tell us a little about your celebration and let’s talk about your wedding website.</p><WhatsAppLink>Discuss Your Wedding Website on WhatsApp</WhatsAppLink></section>
    {activeDemo && <WeddingDemoPlayer key={activeDemo.name} design={activeDemo} onClose={() => setActiveDemo(null)} />}
  </main>;
}

