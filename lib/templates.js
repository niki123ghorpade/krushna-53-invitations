// Card templates = the design library: 4 different illustrated designs per ceremony,
// each offered in 4 colourways. Add a design in lib/designs.ts and it appears here automatically.
import { DESIGNS, designFromDef, findDesign, traditionOf } from "./designs";
import { makeRegionalTemplates, REGIONAL_CULTURES } from "./regional-templates";
import { readUserTemplateRecords } from "./user-templates";
const STYLE = {
    "couple-sea-arch": "Couple", "couple-marquee": "Couple", "couple-haldi-sun": "Couple", "couple-starry": "Couple", "couple-mehndi-garden": "Couple", "couple-sangeet-night": "Couple", "couple-kalyanam": "Couple", "couple-nikah-noor": "Couple",
    "couple-varmala": "Couple", "couple-palace": "Couple", "couple-south": "Couple", "couple-haldi": "Couple", "couple-mehndi": "Couple", "couple-sangeet": "Couple", "couple-engagement": "Couple", "couple-reception": "Couple", "couple-nikah": "Couple", "couple-beach": "Couple",
    "haldi-marigold": "Festive", "haldi-turmeric": "Modern", "haldi-rangoli": "Festive", "haldi-kalash": "Royal",
    "mehndi-parasols": "Festive", "mehndi-lace": "Royal", "mehndi-peacock": "Floral", "mehndi-lanterns": "Modern",
    "sangeet-stage": "Royal", "sangeet-disco": "Modern", "sangeet-dhol": "Festive", "sangeet-neon": "Modern",
    "wedding-mandap": "Floral", "wedding-palace": "Royal", "wedding-agni": "Royal", "wedding-bouquet": "Floral",
    "engagement-garden": "Floral", "engagement-rings": "Modern", "engagement-wreath": "Floral", "engagement-hearts": "Modern",
    "reception-chandelier": "Royal", "reception-deco": "Royal", "reception-fireworks": "Modern", "reception-candles": "Floral",
    "south-muhurtham": "Royal", "kerala-kasavu": "Floral", "bengali-alpona": "Festive", "marathi-paithani": "Royal", "gujarati-bandhani": "Festive",
    "rajasthani-thar": "Royal", "punjabi-phulkari": "Festive", "muslim-nikah": "Royal", "muslim-walima": "Modern", "christian-church": "Floral",
    "madhubani-kohbar": "Festive", "banaras-ghats": "Royal", "goan-sunset": "Modern",
    "royal-baraat": "Royal", "pichwai-lotus": "Floral", "royal-mandala": "Royal", "mughal-garden": "Floral", "pastel-garden": "Floral", "celestial-night": "Modern", "jharokha-bloom": "Royal", "tropical-haldi": "Festive",
    "noir-foil": "Royal", "ruby-engraving": "Royal", "ivory-botanical": "Floral",
};
// Keep the public card catalog focused on broad styles and the new regional
// collection.
const REGIONAL_CARD_TEMPLATES = makeRegionalTemplates();
// Register these scene definitions as well so the canvas renderer can resolve each regional design by id.
DESIGNS.push(...REGIONAL_CARD_TEMPLATES.map((template) => template.def));
export const CARD_TEMPLATES = [
    ...DESIGNS.filter((def) => (!def.tradition || def.art) && STYLE[def.id] !== "Painted").map((def) => ({
        id: def.id,
        name: def.name,
        event: def.event,
        style: def.collectionStyle ?? (def.art ? "Couple" : STYLE[def.id] ?? "Royal"),
        coupleArt: def.coupleArt ?? !!def.art,
        regional: !!def.regional,
        regionLabel: def.regional ? REGIONAL_CULTURES.find((culture) => culture.id === def.tradition)?.label ?? def.tradition : undefined,
        blurb: def.blurb,
        tradition: traditionOf(def),
        def,
    })),
    ...REGIONAL_CARD_TEMPLATES,
];
function userTemplateCard(record) {
    const base = findDesign(record.design.scene) ?? DESIGNS.find((d) => d.event === record.event && !d.tradition);
    if (!base)
        return null;
    const def = { ...base, id: record.id, name: record.name, blurb: `Your saved ${record.event} design`, colorways: [{ name: "My colours", palette: record.design.palette }] };
    return { id: record.id, name: record.name, event: record.event, style: "Modern", blurb: def.blurb, tradition: base.tradition ?? "Pan-Indian", def, customDesign: record.design, savedWording: record.wording, savedAt: record.savedAt ?? 0, userSaved: true };
}
export function readUserTemplateCards() { return readUserTemplateRecords().map(userTemplateCard).filter((t) => !!t); }
export const findTemplate = (id) => id ? CARD_TEMPLATES.find((t) => t.id === id) ?? readUserTemplateCards().find((t) => t.id === id) : undefined;
export const templateDesign = (t, colorway = 0) => t.customDesign ?? designFromDef(t.def, colorway);
