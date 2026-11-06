// Form for /wedding-websites/create. The fields match the Sacred Garden design, and
// buildInvitation() turns them into the garden's content (lib/sacred-garden.js).
import { demoInvitation as demo } from "./demo-invitation";
import { sacredGardenFrom, DEFAULT_WELCOME_TITLE } from "./sacred-garden";

/** [key, label, type?] — type defaults to a single-line text input. */
export const FORM_GROUPS = [
  { title: "Couple", fields: [["blessing", "God's name / blessing line (e.g. ॥ श्री गणेशाय नमः ॥)"], ["groom", "Groom's name"], ["bride", "Bride's name"], ["initials", "Letters on the wax seal (empty = first letters of the names)"], ["date", "Wedding date & time", "datetime-local"]] },
  { title: "Welcome", fields: [["welcomeTitle", "Welcome heading (one line each)", "textarea"], ["welcome", "Welcome message", "textarea"]] },
  { title: "Schedule of events", hint: "One per line: Time | Event", fields: [["program", "Schedule", "textarea"]] },
  { title: "Location", fields: [["venueName", "Venue name"], ["venueAddress", "Address"], ["venueMap", "Map search (optional)"], ["venueImage", "Venue picture (optional, replaces the drawing)", "image"]] },
  { title: "Dress code & gifts", fields: [["dress", "Dress code", "textarea"], ["gifts", "Gift note", "textarea"]] },
  { title: "RSVP", fields: [["rsvpDeadline", "Reply-by note (e.g. Kindly reply by 20 January 2027)"]] },
  { title: "Closing", fields: [["couplePhoto", "Couple photo (optional, replaces the sample)", "image"]] },
];

const lines = (text) => (text || "").split("\n").map((l) => l.split("|").map((p) => p.trim())).filter((r) => r.some(Boolean));

export const formDefaults = {
  blessing: demo.blessing,
  groom: demo.groom,
  bride: demo.bride,
  initials: "",
  date: "2027-02-14T18:30",
  welcomeTitle: DEFAULT_WELCOME_TITLE,
  welcome: demo.welcome.message,
  program: demo.program.map((p) => [p.time, p.title].join(" | ")).join("\n"),
  venueName: demo.venue.name,
  venueAddress: demo.venue.address,
  venueMap: demo.venue.mapQuery,
  venueImage: "",
  dress: [demo.dressCode.women, demo.dressCode.men].join(" "),
  gifts: demo.guestInfo.find((item) => item.icon === "gift").text,
  rsvpDeadline: demo.rsvp.deadline,
  couplePhoto: "",
};

/** "2027-02-14T18:30" → ISO time in IST, or null when empty / invalid. */
function parseWhen(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || "");
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+05:30`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

/** Turns the form into the Sacred Garden content used by <SacredGardenInvitation>. */
export function buildInvitation(f) {
  const groom = f.groom.trim() || "Groom";
  const bride = f.bride.trim() || "Bride";
  const venueName = f.venueName.trim() || "Venue";
  return sacredGardenFrom({
    groom, bride,
    monogram: f.initials.trim() || `${groom[0]} & ${bride[0]}`.toUpperCase(),
    blessing: f.blessing.trim(),
    date: parseWhen(f.date) || demo.date,
    welcome: { title: f.welcomeTitle.trim(), message: f.welcome },
    program: lines(f.program).filter((r) => r[1] || r[0]).map(([time = "", title = ""]) => ({ time, title })),
    venue: { name: venueName, address: f.venueAddress.trim(), mapQuery: f.venueMap.trim() },
    dressCode: { women: f.dress.trim() },
    guestInfo: f.gifts.trim() ? [{ icon: "gift", text: f.gifts.trim() }] : [],
    rsvp: { deadline: f.rsvpDeadline.trim() },
  }, { venue: f.venueImage || undefined, couple: f.couplePhoto || undefined });
}
