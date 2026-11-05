// Content of "The Sacred Garden" invitation. sacredGardenFrom() turns any invitation in the shape of
// lib/demo-invitation.js (the demo, or the create form) into the garden's content.
// Media (films, envelope picture, music) is served from our own assets host.
import { demoInvitation } from "./demo-invitation";
import { LIGHT_BURST_SEAL } from "./envelope-seal-track";

const MEDIA = "https://assets.webgencyinvitations.com/";
export const DEFAULT_WELCOME_TITLE = "Two Hearts\nOne Journey\nA Lifetime Together";

/** Keep the calendar date fixed while rendering its order and digits in the guest's locale. */
const shortDate = (iso = "", lang = "en") => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "";
  const locale = lang === "en" ? "en-GB" : lang;
  try {
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "2-digit", calendar: "gregory", timeZone: "UTC" })
      .formatToParts(new Date(Date.UTC(year, month - 1, day)))
      .filter((part) => ["day", "month", "year"].includes(part.type))
      .map((part) => part.value).join(".");
  } catch {
    return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${String(year).slice(-2)}`;
  }
};

/**
 * d: invitation object (groom, bride, monogram?, blessing, date, welcome { title?, message }, program, venue, dressCode, guestInfo, rsvp).
 * photos: optional { venue, couple } pictures that replace the design's own.
 */
export function sacredGardenFrom(d, photos = {}, lang = "en") {
  const mapQuery = d.venue.mapQuery || [d.venue.name, d.venue.address].filter(Boolean).join(", ");
  return {
    couple: { first: d.groom, second: d.bride, joined: `${d.groom} and ${d.bride}` },
    monogram: d.monogram || `${d.groom[0]} & ${d.bride[0]}`,

    envelope: {
      video: "/invite-art/sacred/envelope-light-burst.mp4",
      // where the wax seal sits in that film, so the couple's letters can be painted on it
      sealTrack: LIGHT_BURST_SEAL,
      tapLabel: "Tap to open",
    },
    music: "https://pub-4dc8201144ca418fb604349c73e8c724.r2.dev/Einaudi_%20Divenire%20(1)%20(1).mp3",

    hero: {
      video: `${MEDIA}Swans2_1_qwzsod.mov`,
      weddingDay: "Wedding Day",
      date: shortDate(d.date, lang),
      scrollLabel: "Scroll down",
    },
    welcome: {
      blessing: d.blessing,
      title: d.welcome.title ?? DEFAULT_WELCOME_TITLE,
      message: d.welcome.message,
    },

    countdown: { title: "The Celebration Begins In", date: d.date, labels: ["Days", "Hours", "Minutes", "Seconds"] },

    schedule: {
      title: "Schedule of Events",
      items: d.program.map(({ time, title }) => ({ time, title })),
    },

    location: {
      title: "Location",
      name: d.venue.name,
      address: d.venue.address ? `Address: ${d.venue.address}` : "",
      mapEmbed: `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`,
      image: photos.venue,
    },

    dressCode: { title: "Dress Code", text: [d.dressCode.women, d.dressCode.men].filter(Boolean).join(" ") },
    gifts: { title: "Gift Preference", text: d.guestInfo.find((item) => item.icon === "gift")?.text },

    rsvp: {
      title: "Confirm Your Attendance",
      text: "To help us prepare for a joyful celebration, kindly confirm your attendance.",
      openLabel: "Click to open",
      note: d.rsvp.deadline,
      // Replies are POSTed here as a form; empty means this demo only shows the thank-you.
      endpoint: "",
      fields: [
        { name: "Your name", type: "text", required: true },
        { name: "Will you be attending?", type: "radio", options: ["Accepts with pleasure", "Declines with regret"], required: true },
        { name: "Number of Guests Attending", type: "text", required: true },
        { name: "A Song That Gets You Dancing", type: "text" },
        { name: "Children Attending", hint: "Please include names and ages.", type: "text", required: true },
      ],
      submit: "Submit",
      required: "Required field",
      success: "Thank you! Your RSVP has been received.",
      failure: "Sorry, your RSVP could not be sent. Please try again.",
    },

    closing: { title: "Hope to see you there!", photo: photos.couple },
  };
}

export function sacredGardenFor(lang) {
  return sacredGardenFrom(demoInvitation, {}, lang);
}

export const sacredGarden = sacredGardenFrom(demoInvitation);
