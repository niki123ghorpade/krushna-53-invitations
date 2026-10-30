import { paintedScene } from "./painted";

// Culture-led artwork without people; invitation wording is rendered separately.
const settings = [
    { id: "regional-gulabi-courtyard", name: "Gulabi Jharokha", tradition: "Rajasthani", blurb: "Pink sandstone jharokhas, bandhani drapes and brass lanterns", title: "Shubh Vivah", fonts: "luxe", composition: "weds", wash: "#fff0e2", particles: "petals" },
    { id: "regional-paithani-lamps", name: "Paithani & Samai", tradition: "Marathi", blurb: "A carved wada, Paithani motifs, marigolds and traditional samai lamps", title: "Shubh Vivah", fonts: "heritage", composition: "classic", wash: "#fff5e3", particles: "marigold" },
    { id: "regional-jasmine-temple", name: "Jasmine & Kolam", tradition: "South Indian", blurb: "Temple pillars, jasmine garlands, kolam and glowing brass lamps", title: "Kalyanam", fonts: "romantic", composition: "dateblock", wash: "#fff5e3", particles: "petals" },
    { id: "regional-bengali-alpona", name: "Alpona & Shola", tradition: "Bengali", blurb: "A terracotta rajbari, white alpona, shola flowers and red-and-white garlands", title: "Shubho Bibaho", fonts: "classic", composition: "weds", wash: "#fff3e8", particles: "petals" },
    { id: "regional-gujarati-bandhani", name: "Bandhani Mandap", tradition: "Gujarati", blurb: "Carved wood, bandhani and patola drapes, mirror-work accents and ceremonial rangoli", title: "Shubh Lagna", fonts: "luxe", composition: "classic", wash: "#fff5e2", particles: "marigold" },
];
export const REGIONAL_SCENIC_DESIGNS = settings.map(({ wash, title, ...item }) => {
    const art = `/art/regional/${item.id}.webp`;
    return {
        ...item, event: "wedding", regional: true, collectionStyle: "Royal", coupleArt: false,
        art, scene: paintedScene({ src: art, sky: "light", wash: 1250 }),
        frame: "none", backdrop: "none", layout: "center", region: [110, 1100], intro: "bloom",
        wording: { title, hostLine: "With the blessings of our families, we invite you to our", message: "Your presence and blessings will make our celebration complete." },
        colorways: [
            { name: "Maroon & gold", palette: { deep: "#5a1420", sky: wash, accent: "#a8701a", flower: "#c2244a", text: "#4a1018" } },
            { name: "Royal blue", palette: { deep: "#14205a", sky: wash, accent: "#a8823a", flower: "#3a4ad6", text: "#18224a" } },
            { name: "Emerald", palette: { deep: "#0f4a34", sky: wash, accent: "#9a7a2a", flower: "#c2244a", text: "#123a2a" } },
            { name: "Warm sepia", palette: { deep: "#3a2414", sky: wash, accent: "#a8823a", flower: "#b5302a", text: "#3a2414" } },
        ],
    };
});
