"use client";
import "./sacred-fonts.css";
import { useRef } from "react";
import { useArtboardMotion } from "./Artboard";
import { SG_ART } from "./assets";
import SgHero from "./SgHero";
import SgCountdown from "./SgCountdown";
import SgSchedule from "./SgSchedule";
import SgLocation from "./SgLocation";
import SgMap from "./SgMap";
import SgDressGift from "./SgDressGift";
import SgRsvp from "./SgRsvp";
import SgClosing from "./SgClosing";
import g from "./garden.module.css";

/**
 * The Sacred Garden invitation: cover film with the names, welcome on torn paper, countdown,
 * schedule, location and map, dress code and gifts, a wax-seal RSVP and a closing photo.
 * c: content in the shape of lib/sacred-garden.js.
 * The motion starts as soon as the page loads (the opening envelope sits on top meanwhile).
 */
export default function SacredGardenInvitation({ c }) {
  const root = useRef(null);
  useArtboardMotion(root, true, c);
  return <div ref={root} className={`${g.vars} ${g.page}`}>
    <SgHero first={c.couple.first} second={c.couple.second} date={c.hero.date} weddingDay={c.hero.weddingDay} scrollLabel={c.hero.scrollLabel}
      video={c.hero.video} blessing={c.welcome.blessing} blessingImage={c.welcome.blessingImage} title={c.welcome.title} message={c.welcome.message} nextId="sg-countdown" />
    <SgCountdown title={c.countdown.title} date={c.countdown.date} labels={c.countdown.labels} />
    <SgSchedule title={c.schedule.title} items={c.schedule.items} />
    <SgLocation title={c.location.title} name={c.location.name} address={c.location.address} image={c.location.image || SG_ART.venue} vignette={Boolean(c.location.image)} />
    <SgMap embedSrc={c.location.mapEmbed} title={c.location.name} />
    <SgDressGift dressTitle={c.dressCode.title} dress={c.dressCode.text} giftTitle={c.gifts.title} gift={c.gifts.text} />
    <SgRsvp title={c.rsvp.title} text={c.rsvp.text} openLabel={c.rsvp.openLabel} note={c.rsvp.note} fields={c.rsvp.fields} endpoint={c.rsvp.endpoint}
      submit={c.rsvp.submit} required={c.rsvp.required} success={c.rsvp.success} failure={c.rsvp.failure} />
    <SgClosing title={c.closing.title} names={c.couple.joined} photo={c.closing.photo || undefined} />
  </div>;
}
