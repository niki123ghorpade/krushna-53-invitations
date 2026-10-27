// Illustrated bride & groom designs, drawn entirely in code.
import { alpha, darken, lighten, mix } from "./color";
import { H, W, bananaLeaf, bulb, glow, goldGradient, hangPoints, leaf, marigold, rng, rose, sparkle } from "./draw-kit";
import { archPath, leafGreen, mg1, mg2, vGradient } from "./scenes";
import { fanoos, gopuram, ogeeArch } from "./scenes-regional";
const SKIN = "#e0a982";
const SKIN_SHADE = "#c98b66";
const HAIR = "#2a1a14";
// ───────────────────────── helpers ─────────────────────────
/** Horizontal shading so fabric looks round: dark edges, light centre. */
function fabric(ctx, x1, x2, base, k = 0.28) {
    const g = ctx.createLinearGradient(x1, 0, x2, 0);
    g.addColorStop(0, darken(base, k));
    g.addColorStop(0.35, lighten(base, 0.08));
    g.addColorStop(0.55, base);
    g.addColorStop(1, darken(base, k * 1.2));
    return g;
}
function limb(ctx, pts, w, color) {
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++)
        ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
}
function dots(ctx, seed, n, inside, box, color, r) {
    const rr = rng(seed);
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
        const x = box[0] + rr() * (box[2] - box[0]), y = box[1] + rr() * (box[3] - box[1]);
        if (!inside(x, y))
            continue;
        ctx.beginPath();
        ctx.arc(x, y, r * (0.6 + rr() * 0.7), 0, Math.PI * 2);
        ctx.fill();
    }
}
function head(ctx, x, y, s) {
    // neck
    ctx.fillStyle = SKIN_SHADE;
    ctx.fillRect(x - 13 * s, y + 30 * s, 26 * s, 42 * s);
    const g = ctx.createRadialGradient(x - 10 * s, y - 12 * s, 4 * s, x, y, 52 * s);
    g.addColorStop(0, lighten(SKIN, 0.12));
    g.addColorStop(1, SKIN_SHADE);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 37 * s, 47 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // soft blush
    ctx.fillStyle = alpha("#e0607a", 0.18);
    ctx.beginPath();
    ctx.ellipse(x - 22 * s, y + 25 * s, 8 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 22 * s, y + 25 * s, 8 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
}
/** Small, readable facial features that keep the existing fashion-illustration style. */
function facialFeatures(ctx, x, y, s, gaze = 0) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const side of [-1, 1]) {
        const ex = x + side * 12 * s;
        // Soft brows and almond-shaped eyes.
        ctx.strokeStyle = "#51332e";
        ctx.lineWidth = 2.2 * s;
        ctx.beginPath();
        ctx.moveTo(ex - 5 * s, y + 5 * s);
        ctx.quadraticCurveTo(ex, y + 1 * s, ex + 5 * s, y + 5 * s);
        ctx.stroke();
        ctx.fillStyle = "#fff8ef";
        ctx.beginPath();
        ctx.ellipse(ex, y + 12 * s, 5 * s, 3.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#34211d";
        ctx.beginPath();
        ctx.arc(ex + gaze * s, y + 12 * s, 2.2 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex + gaze * s - 0.6 * s, y + 11.2 * s, 0.7 * s, 0, Math.PI * 2);
        ctx.fill();
    }
    // A light nose line and a gentle smile finish the face without overpowering it.
    ctx.strokeStyle = alpha("#8c5545", 0.8);
    ctx.lineWidth = 1.7 * s;
    ctx.beginPath();
    ctx.moveTo(x + 1 * s, y + 15 * s);
    ctx.quadraticCurveTo(x + 4 * s, y + 22 * s, x + 1 * s, y + 25 * s);
    ctx.stroke();
    ctx.strokeStyle = "#a94d55";
    ctx.lineWidth = 2.1 * s;
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, y + 33 * s);
    ctx.quadraticCurveTo(x, y + 37 * s, x + 6 * s, y + 33 * s);
    ctx.stroke();
    ctx.restore();
}
// ───────────────────────── bride ─────────────────────────
function bride(ctx, p, cx, top, s, outfit, handTo, dupattaColor) {
    const X = (v) => cx + v * s, Y = (v) => top + v * s;
    const main = outfit === "haldi" ? mix("#f4c430", p.flower, 0.25) : p.flower;
    const veil = dupattaColor ?? main;
    const gold = p.accent;
    const hem = 830;
    // dupatta behind (lehenga / haldi)
    if (outfit !== "gown") {
        ctx.fillStyle = alpha(lighten(veil, 0.25), outfit === "saree" ? 0.95 : 0.55);
        ctx.beginPath();
        ctx.moveTo(X(-46), Y(10));
        ctx.bezierCurveTo(X(-150), Y(220), X(-200), Y(520), X(-215), Y(hem));
        ctx.lineTo(X(-120), Y(hem));
        ctx.bezierCurveTo(X(-110), Y(500), X(-70), Y(250), X(-10), Y(110));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldGradient(ctx, X(-220), 0, X(0), 0, gold);
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(X(-46), Y(10));
        ctx.bezierCurveTo(X(-150), Y(220), X(-200), Y(520), X(-215), Y(hem));
        ctx.stroke();
    }
    else {
        // long open hair flowing behind
        ctx.fillStyle = HAIR;
        ctx.beginPath();
        ctx.moveTo(X(-34), Y(20));
        ctx.bezierCurveTo(X(-70), Y(140), X(-60), Y(260), X(-40), Y(330));
        ctx.lineTo(X(30), Y(300));
        ctx.bezierCurveTo(X(40), Y(200), X(40), Y(80), X(34), Y(20));
        ctx.closePath();
        ctx.fill();
    }
    // skirt
    const skirt = () => {
        ctx.beginPath();
        if (outfit === "saree") {
            ctx.moveTo(X(-50), Y(300));
            ctx.bezierCurveTo(X(-90), Y(420), X(-120), Y(640), X(-150), Y(hem + 20));
            ctx.quadraticCurveTo(X(0), Y(hem + 40), X(150), Y(hem + 20));
            ctx.bezierCurveTo(X(120), Y(640), X(90), Y(420), X(50), Y(300));
        }
        else if (outfit === "gown") {
            ctx.moveTo(X(-46), Y(300));
            ctx.bezierCurveTo(X(-70), Y(520), X(-150), Y(700), X(-250), Y(hem + 20));
            ctx.quadraticCurveTo(X(0), Y(hem + 50), X(250), Y(hem + 20));
            ctx.bezierCurveTo(X(150), Y(700), X(70), Y(520), X(46), Y(300));
        }
        else {
            ctx.moveTo(X(-50), Y(300));
            ctx.bezierCurveTo(X(-110), Y(420), X(-200), Y(640), X(-235), Y(hem));
            ctx.quadraticCurveTo(X(0), Y(hem + 30), X(235), Y(hem));
            ctx.bezierCurveTo(X(200), Y(640), X(110), Y(420), X(50), Y(300));
        }
        ctx.closePath();
    };
    skirt();
    ctx.fillStyle = fabric(ctx, X(-240), X(240), main);
    ctx.fill();
    ctx.save();
    skirt();
    ctx.clip();
    // pleats
    for (let i = -9; i <= 9; i++) {
        const tx = X(i * 26);
        const g = ctx.createLinearGradient(tx - 12 * s, 0, tx + 12 * s, 0);
        g.addColorStop(0, alpha("#000000", 0));
        g.addColorStop(0.5, alpha("#000000", 0.12));
        g.addColorStop(1, alpha("#000000", 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(X(i * 4), Y(300));
        ctx.lineTo(tx + 14 * s, Y(hem + 40));
        ctx.lineTo(tx - 14 * s, Y(hem + 40));
        ctx.closePath();
        ctx.fill();
    }
    if (outfit === "gown") {
        // sequins sparkle all over the gown, denser towards the hem
        const rr = rng(4);
        for (let i = 0; i < 520; i++) {
            const y = 320 + Math.pow(rr(), 0.6) * (hem - 300);
            const x = (rr() - 0.5) * 2 * (40 + (y - 300) * 0.4);
            ctx.fillStyle = alpha(i % 3 ? "#ffffff" : lighten(main, 0.6), 0.35 + rr() * 0.5);
            ctx.beginPath();
            ctx.arc(X(x), Y(y), (1.2 + rr() * 2.4) * s, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (outfit === "saree") {
        // front pleats fanning out, wide zari border at the hem
        ctx.strokeStyle = alpha(darken(main, 0.35), 0.5);
        ctx.lineWidth = 2.5 * s;
        for (let i = -4; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo(X(10 + i * 4), Y(330));
            ctx.lineTo(X(10 + i * 16), Y(hem + 30));
            ctx.stroke();
        }
        ctx.fillStyle = goldGradient(ctx, X(-160), 0, X(160), 0, gold);
        ctx.beginPath();
        ctx.moveTo(X(-170), Y(hem - 50));
        ctx.quadraticCurveTo(X(0), Y(hem - 25), X(170), Y(hem - 50));
        ctx.lineTo(X(170), Y(hem + 60));
        ctx.lineTo(X(-170), Y(hem + 60));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = darken(main, 0.25);
        for (let i = -5; i <= 5; i++) {
            ctx.beginPath();
            ctx.moveTo(X(i * 28), Y(hem - 30));
            ctx.lineTo(X(i * 28 - 8), Y(hem - 6));
            ctx.lineTo(X(i * 28 + 8), Y(hem - 6));
            ctx.fill();
        }
        dots(ctx, 13, 90, () => true, [X(-150), Y(340), X(150), Y(hem - 60)], alpha(lighten(gold, 0.2), 0.85), 3.4 * s);
    }
    else {
        // gold borders and buttis
        ctx.fillStyle = goldGradient(ctx, X(-240), 0, X(240), 0, gold);
        ctx.beginPath();
        ctx.moveTo(X(-260), Y(hem - 40));
        ctx.quadraticCurveTo(X(0), Y(hem - 10), X(260), Y(hem - 40));
        ctx.lineTo(X(260), Y(hem + 60));
        ctx.lineTo(X(-260), Y(hem + 60));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = darken(main, 0.3);
        for (let i = -8; i <= 8; i++) {
            ctx.beginPath();
            ctx.arc(X(i * 27), Y(hem - 12 + Math.abs(i) * -1.2), 6 * s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = goldGradient(ctx, X(-200), 0, X(200), 0, gold);
        ctx.lineWidth = 6 * s;
        ctx.beginPath();
        ctx.moveTo(X(-190), Y(hem - 140));
        ctx.quadraticCurveTo(X(0), Y(hem - 115), X(190), Y(hem - 140));
        ctx.stroke();
        dots(ctx, 11, 160, () => true, [X(-240), Y(330), X(240), Y(hem - 60)], alpha(lighten(gold, 0.2), 0.85), 3.4 * s);
        if (outfit === "haldi")
            dots(ctx, 12, 60, () => true, [X(-240), Y(380), X(240), Y(hem - 60)], alpha("#ffffff", 0.75), 4 * s);
    }
    ctx.restore();
    // torso / blouse
    const blouse = outfit === "gown" ? main : darken(main, 0.12);
    ctx.fillStyle = fabric(ctx, X(-62), X(62), blouse, 0.3);
    ctx.beginPath();
    ctx.moveTo(X(-58), Y(140));
    ctx.quadraticCurveTo(X(0), Y(outfit === "gown" ? 160 : 128), X(58), Y(140));
    ctx.lineTo(X(46), Y(305));
    ctx.lineTo(X(-46), Y(305));
    ctx.closePath();
    ctx.fill();
    if (outfit === "gown") {
        // off-shoulder: bare shoulders above the bodice
        ctx.fillStyle = SKIN;
        ctx.beginPath();
        ctx.moveTo(X(-60), Y(140));
        ctx.quadraticCurveTo(X(0), Y(150), X(60), Y(140));
        ctx.lineTo(X(52), Y(118));
        ctx.quadraticCurveTo(X(0), Y(105), X(-52), Y(118));
        ctx.closePath();
        ctx.fill();
        dots(ctx, 7, 70, () => true, [X(-50), Y(160), X(50), Y(300)], alpha("#ffffff", 0.7), 1.8 * s);
    }
    else {
        ctx.strokeStyle = goldGradient(ctx, X(-60), 0, X(60), 0, gold);
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(X(-40), Y(135));
        ctx.quadraticCurveTo(X(0), Y(185), X(40), Y(135));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(X(-46), Y(300));
        ctx.lineTo(X(46), Y(300));
        ctx.stroke();
    }
    if (outfit === "saree") {
        ctx.fillStyle = fabric(ctx, X(-70), X(70), veil, 0.25);
        ctx.beginPath();
        ctx.moveTo(X(-60), Y(140));
        ctx.lineTo(X(-20), Y(132));
        ctx.lineTo(X(56), Y(320));
        ctx.lineTo(X(40), Y(345));
        ctx.lineTo(X(-50), Y(220));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = goldGradient(ctx, X(-60), 0, X(60), 0, gold);
        ctx.lineWidth = 9 * s;
        ctx.beginPath();
        ctx.moveTo(X(-20), Y(134));
        ctx.lineTo(X(52), Y(322));
        ctx.stroke();
    }
    // arms
    const shoulderL = [X(-56), Y(150)], shoulderR = [X(56), Y(150)];
    const sleeve = outfit === "gown" ? SKIN : blouse;
    // left arm hangs, holding the skirt
    limb(ctx, [shoulderL, [X(-80), Y(300)], [X(-92), Y(430)]], 30 * s, SKIN);
    limb(ctx, [shoulderL, [X(-74), Y(250)]], 36 * s, sleeve);
    // right arm reaches to the groom's hand
    const elbow = [X(78), Y(290)];
    limb(ctx, [shoulderR, elbow, handTo], 30 * s, SKIN);
    limb(ctx, [shoulderR, [X(70), Y(240)]], 36 * s, sleeve);
    if (outfit !== "gown") {
        // chooda bangles on the forearms
        for (const [a, b] of [[[X(-82), Y(330)], [X(-90), Y(410)]], [elbow, handTo]]) {
            for (let k = 0; k < 7; k++) {
                const u = 0.25 + k * 0.08;
                const bx = a[0] + (b[0] - a[0]) * u, by = a[1] + (b[1] - a[1]) * u;
                ctx.fillStyle = k % 2 ? (outfit === "haldi" ? "#ffffff" : "#c8102e") : gold;
                ctx.beginPath();
                ctx.arc(bx, by, 14 * s, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(X(-92), Y(438), 13 * s, 0, Math.PI * 2);
    ctx.fill();
    // head, hair & jewellery
    head(ctx, cx, Y(52), s);
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.ellipse(cx, Y(30), 36 * s, 30 * s, 0, Math.PI, 0);
    ctx.fill();
    if (outfit === "gown") {
        ctx.beginPath();
        ctx.moveTo(X(34), Y(30));
        ctx.bezierCurveTo(X(50), Y(120), X(46), Y(200), X(30), Y(260));
        ctx.lineTo(X(18), Y(120));
        ctx.closePath();
        ctx.fill();
    }
    else {
        // hair parted in the centre, framing the face
        ctx.beginPath();
        ctx.moveTo(X(-36), Y(40));
        ctx.quadraticCurveTo(X(-40), Y(80), X(-30), Y(100));
        ctx.lineTo(X(-24), Y(40));
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(X(36), Y(40));
        ctx.quadraticCurveTo(X(40), Y(80), X(30), Y(100));
        ctx.lineTo(X(24), Y(40));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#d4002a";
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.moveTo(cx, Y(2));
        ctx.lineTo(cx, Y(22));
        ctx.stroke(); // sindoor
    }
    ctx.fillStyle = goldGradient(ctx, X(-20), 0, X(20), 0, gold);
    if (outfit !== "gown") {
        ctx.beginPath();
        ctx.arc(cx, Y(28), 6 * s, 0, Math.PI * 2);
        ctx.fill(); // maang tikka
    }
    for (const sd of [-1, 1]) { // earrings
        ctx.beginPath();
        ctx.moveTo(X(sd * 34), Y(62));
        ctx.lineTo(X(sd * 34 - 8), Y(82));
        ctx.lineTo(X(sd * 34 + 8), Y(82));
        ctx.closePath();
        ctx.fill();
    }
    // necklace
    ctx.strokeStyle = goldGradient(ctx, X(-30), 0, X(30), 0, gold);
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.arc(cx, Y(96), 30 * s, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = outfit === "haldi" ? "#ffffff" : alpha(gold, 1);
    for (let i = 0; i < 7; i++) {
        const a = 0.3 * Math.PI + (i / 6) * 0.4 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 30 * s, Y(96) + Math.sin(a) * 30 * s + 6 * s, 4 * s, 0, Math.PI * 2);
        ctx.fill();
    }
    if (outfit === "saree") {
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 9; i++) {
            ctx.beginPath();
            ctx.arc(X(-38 - Math.sin(i / 3) * 6), Y(20 + i * 12), 5 * s, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    // dupatta draped over the head, framing the face
    if (outfit !== "gown" && outfit !== "saree") {
        const hood = () => {
            ctx.beginPath();
            ctx.moveTo(X(-62), Y(230));
            ctx.bezierCurveTo(X(-64), Y(120), X(-60), Y(-20), X(0), Y(-16));
            ctx.bezierCurveTo(X(60), Y(-20), X(66), Y(120), X(62), Y(260));
            ctx.lineTo(X(44), Y(150));
            ctx.bezierCurveTo(X(46), Y(40), X(30), Y(4), X(0), Y(4));
            ctx.bezierCurveTo(X(-30), Y(4), X(-46), Y(40), X(-44), Y(140));
            ctx.closePath();
        };
        hood();
        ctx.fillStyle = alpha(lighten(veil, 0.18), 0.85);
        ctx.fill();
        ctx.strokeStyle = goldGradient(ctx, X(-60), 0, X(60), 0, gold);
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(X(-62), Y(230));
        ctx.bezierCurveTo(X(-64), Y(120), X(-60), Y(-20), X(0), Y(-16));
        ctx.bezierCurveTo(X(60), Y(-20), X(66), Y(120), X(62), Y(260));
        ctx.stroke();
        ctx.fillStyle = alpha(lighten(gold, 0.3), 0.9);
        for (let i = 0; i < 14; i++) {
            const u = i / 13;
            ctx.beginPath();
            ctx.arc(X(-58 + 116 * u), Y(-6 + 260 * Math.pow(Math.abs(u - 0.5) * 2, 2.2) * 0.9), 2.6 * s, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    facialFeatures(ctx, cx, Y(52), s, 0.7);
}
// ───────────────────────── groom ─────────────────────────
function groom(ctx, p, cx, top, s, outfit, coat, handAt) {
    const X = (v) => cx + v * s, Y = (v) => top + v * s;
    const gold = p.accent;
    const legs = outfit === "tux" ? darken(coat, 0.1) : outfit === "kurta" || outfit === "veshti" ? "#fbf6ea" : outfit === "bandhgala" ? darken(coat, 0.05) : lighten(coat, 0.25);
    const coatEnd = outfit === "tux" ? 470 : outfit === "kurta" ? 560 : outfit === "veshti" ? 430 : outfit === "bandhgala" ? 520 : 640;
    // legs + shoes
    if (outfit === "veshti") {
        // white veshti wrapped to the ankles with a gold border
        ctx.fillStyle = fabric(ctx, X(-80), X(80), "#fbf6ea", 0.12);
        ctx.beginPath();
        ctx.moveTo(X(-74), Y(400));
        ctx.lineTo(X(74), Y(400));
        ctx.lineTo(X(82), Y(850));
        ctx.lineTo(X(-82), Y(850));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = goldGradient(ctx, X(-82), 0, X(82), 0, gold);
        ctx.fillRect(X(-82), Y(822), 164 * s, 26 * s);
        ctx.fillRect(X(18), Y(400), 14 * s, 430 * s);
    }
    else {
        limb(ctx, [[X(-26), Y(coatEnd - 40)], [X(-30), Y(860)]], 40 * s, legs);
        limb(ctx, [[X(26), Y(coatEnd - 40)], [X(30), Y(860)]], 40 * s, legs);
    }
    ctx.fillStyle = outfit === "tux" ? "#111111" : goldGradient(ctx, X(-70), 0, X(70), 0, gold);
    for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(X(sd * 34), Y(872), 30 * s, 13 * s, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    // coat / sherwani / kurta
    const body = () => {
        ctx.beginPath();
        ctx.moveTo(X(-72), Y(170));
        ctx.quadraticCurveTo(X(0), Y(150), X(72), Y(170));
        ctx.lineTo(X(outfit === "tux" ? 66 : 92), Y(coatEnd));
        ctx.quadraticCurveTo(X(0), Y(coatEnd + 14), X(outfit === "tux" ? -66 : -92), Y(coatEnd));
        ctx.closePath();
    };
    body();
    ctx.fillStyle = fabric(ctx, X(-95), X(95), coat, 0.3);
    ctx.fill();
    ctx.save();
    body();
    ctx.clip();
    if (outfit === "tux") {
        // white shirt V, satin lapels, bow tie
        ctx.fillStyle = "#f8f8f6";
        ctx.beginPath();
        ctx.moveTo(X(-28), Y(165));
        ctx.lineTo(X(28), Y(165));
        ctx.lineTo(X(0), Y(330));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = lighten(coat, 0.12);
        for (const sd of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(X(sd * 30), Y(165));
            ctx.lineTo(X(sd * 56), Y(175));
            ctx.lineTo(X(sd * 6), Y(335));
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = "#111111";
        ctx.beginPath();
        ctx.moveTo(X(0), Y(185));
        ctx.lineTo(X(-20), Y(174));
        ctx.lineTo(X(-20), Y(196));
        ctx.closePath();
        ctx.moveTo(X(0), Y(185));
        ctx.lineTo(X(20), Y(174));
        ctx.lineTo(X(20), Y(196));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X(46), Y(225), 18 * s, 6 * s); // pocket square
    }
    else {
        // placket, buttons, embroidered borders
        ctx.strokeStyle = goldGradient(ctx, X(-90), 0, X(90), 0, gold);
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(X(0), Y(165));
        ctx.lineTo(X(0), Y(coatEnd));
        ctx.stroke();
        ctx.fillStyle = goldGradient(ctx, X(-10), 0, X(10), 0, gold);
        for (let y = 190; y < coatEnd - 20; y += 34) {
            ctx.beginPath();
            ctx.arc(X(8), Y(y), 5 * s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillRect(X(-100), Y(coatEnd - 26), 200 * s, 26 * s);
        if (outfit === "sherwani")
            dots(ctx, 21, 90, () => true, [X(-95), Y(200), X(95), Y(coatEnd - 30)], alpha(lighten(gold, 0.2), 0.6), 2.6 * s);
    }
    ctx.restore();
    if (outfit !== "tux") {
        // high collar
        ctx.fillStyle = goldGradient(ctx, X(-24), 0, X(24), 0, gold);
        ctx.fillRect(X(-22), Y(140), 44 * s, 26 * s);
    }
    if (outfit === "veshti") {
        // angavastram over the shoulder
        ctx.fillStyle = "#fffaf0";
        ctx.beginPath();
        ctx.moveTo(X(-72), Y(170));
        ctx.lineTo(X(-30), Y(160));
        ctx.lineTo(X(70), Y(400));
        ctx.lineTo(X(40), Y(420));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = gold;
        ctx.lineWidth = 6 * s;
        ctx.beginPath();
        ctx.moveTo(X(-30), Y(160));
        ctx.lineTo(X(70), Y(400));
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i <= 18; i++) {
            const a = Math.PI * i / 18;
            ctx.beginPath();
            ctx.arc(X(-40 * Math.cos(a)), Y(170 + 150 * Math.sin(a)), 6 * s, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    if (outfit === "sherwani") {
        // stole over the shoulder + pearl mala
        ctx.fillStyle = alpha(p.flower, 0.92);
        ctx.beginPath();
        ctx.moveTo(X(-72), Y(170));
        ctx.lineTo(X(-40), Y(160));
        ctx.lineTo(X(80), Y(470));
        ctx.lineTo(X(60), Y(500));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = gold;
        ctx.lineWidth = 3 * s;
        ctx.stroke();
        ctx.fillStyle = "#fffaf0";
        for (let i = 0; i <= 26; i++) {
            const u = i / 26;
            const a = Math.PI * u;
            ctx.beginPath();
            ctx.arc(X(-46 * Math.cos(a)), Y(170 + 230 * Math.sin(a)), 5 * s, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    // arms
    const sleeve = coat;
    limb(ctx, [[X(68), Y(185)], [X(92), Y(330)], [X(98), Y(470)]], 40 * s, sleeve);
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(X(98), Y(486), 14 * s, 0, Math.PI * 2);
    ctx.fill();
    const elbow = [X(-86), Y(330)];
    limb(ctx, [[X(-68), Y(185)], elbow, [handAt[0] + 14 * s, handAt[1]]], 40 * s, sleeve);
    if (outfit !== "tux") {
        ctx.strokeStyle = gold;
        ctx.lineWidth = 7 * s;
        ctx.beginPath();
        ctx.moveTo(handAt[0] + 18 * s, handAt[1] - 16 * s);
        ctx.lineTo(handAt[0] + 22 * s, handAt[1] + 16 * s);
        ctx.stroke();
    }
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(handAt[0], handAt[1], 15 * s, 0, Math.PI * 2);
    ctx.fill();
    // head
    head(ctx, cx, Y(78), s);
    ctx.fillStyle = HAIR;
    if (outfit === "sherwani") {
        // safa turban with brooch and plume
        const t = goldGradient(ctx, X(-60), 0, X(60), 0, mix(p.flower, gold, 0.35));
        ctx.fillStyle = t;
        ctx.beginPath();
        ctx.moveTo(X(-40), Y(70));
        ctx.bezierCurveTo(X(-62), Y(20), X(-30), Y(-10), X(0), Y(-8));
        ctx.bezierCurveTo(X(36), Y(-10), X(64), Y(20), X(40), Y(70));
        ctx.quadraticCurveTo(X(0), Y(50), X(-40), Y(70));
        ctx.fill();
        ctx.strokeStyle = alpha(darken(p.flower, 0.4), 0.5);
        ctx.lineWidth = 2.5 * s;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(X(-46 + i * 8), Y(58 - i * 14));
            ctx.quadraticCurveTo(X(0), Y(30 - i * 12), X(46 - i * 6), Y(56 - i * 15));
            ctx.stroke();
        }
        ctx.fillStyle = mix(p.flower, gold, 0.35);
        ctx.beginPath();
        ctx.moveTo(X(36), Y(50));
        ctx.quadraticCurveTo(X(70), Y(140), X(58), Y(250));
        ctx.lineTo(X(44), Y(240));
        ctx.quadraticCurveTo(X(50), Y(130), X(26), Y(64));
        ctx.fill();
        ctx.fillStyle = "#fff6e0";
        ctx.beginPath();
        ctx.arc(cx, Y(22), 9 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c8102e";
        ctx.beginPath();
        ctx.arc(cx, Y(22), 5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff6e0";
        ctx.beginPath();
        ctx.moveTo(cx, Y(14));
        ctx.quadraticCurveTo(X(-10), Y(-20), X(14), Y(-40));
        ctx.quadraticCurveTo(X(10), Y(-10), X(4), Y(14));
        ctx.fill();
    }
    else {
        ctx.beginPath();
        ctx.ellipse(cx, Y(54), 37 * s, 28 * s, 0, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(X(10), Y(36), 30 * s, 16 * s, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    facialFeatures(ctx, cx, Y(78), s, -0.7);
}
/** Bride (left) and groom (right) holding hands. */
function couple(ctx, p, o) {
    const s = o.s ?? 1, cx = o.cx ?? 540, foot = o.footY ?? 1880;
    const bTop = foot - 860 * s, gTop = foot - 885 * s;
    const hand = [cx, bTop + 470 * s];
    // ground shadow
    ctx.fillStyle = alpha("#000000", 0.22);
    ctx.beginPath();
    ctx.ellipse(cx, foot, 360 * s, 34 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    groom(ctx, p, cx + 125 * s, gTop, s, o.groom, o.coat, [hand[0] + 6 * s, hand[1] + 6 * s]);
    bride(ctx, p, cx - 120 * s, bTop, s, o.bride, hand, o.dupatta);
}
// ───────────────────────── scenes ─────────────────────────
function roseBush(ctx, p, x, y, w, seed, cols) {
    const r = rng(seed);
    for (let i = 0; i < 26; i++)
        leaf(ctx, x + (r() - 0.5) * w, y + (r() - 0.5) * w * 0.5, 40 + r() * 30, 14, r() * 6, i % 2 ? leafGreen(p) : darken(leafGreen(p), 0.25));
    for (let i = 0; i < 20; i++)
        rose(ctx, x + (r() - 0.5) * w, y + (r() - 0.6) * w * 0.5, 18 + r() * 20, cols[i % cols.length], r() * 6);
}
/** Wedding: bride & groom in a rose arch by the sea at sunset. */
export const coupleSeaArch = {
    still(ctx, p) {
        vGradient(ctx, [[0, lighten(p.sky, 0.3)], [0.42, mix(p.sky, "#ffb38a", 0.35)], [0.62, mix("#ffcf8a", p.sky, 0.3)], [0.66, "#7fb6c9"], [0.74, "#5d99b0"], [0.75, mix("#7aa35a", p.deep, 0.1)], [1, darken(mix("#5f8f45", p.deep, 0.15), 0.2)]]);
        glow(ctx, 540, 1250, 420, "#fff1c0", 0.55);
        ctx.fillStyle = alpha("#ffffff", 0.35);
        for (let i = 0; i < 30; i++)
            ctx.fillRect(160 + ((i * 97) % 760), 1290 + (i % 6) * 22, 60, 3);
        const cols = [p.flower, lighten(p.flower, 0.45), "#ffffff", mix(p.flower, "#ffffff", 0.7)];
        // garden arch of roses
        const pts = archPath(540, 400, 720, 1860, 24);
        const r = rng(9);
        for (const pt of pts)
            for (let k = 0; k < 2; k++)
                leaf(ctx, pt.x + (r() - 0.5) * 50, pt.y + (r() - 0.5) * 50, 40 + r() * 30, 15, r() * 6, k ? leafGreen(p) : darken(leafGreen(p), 0.2));
        for (const pt of pts)
            for (let k = 0; k < 3; k++)
                rose(ctx, pt.x + (r() - 0.5) * 70, pt.y + (r() - 0.5) * 60, 18 + r() * 22, cols[Math.floor(r() * cols.length)], r() * 6);
        roseBush(ctx, p, 130, 1800, 300, 3, cols);
        roseBush(ctx, p, 950, 1800, 300, 4, cols);
        couple(ctx, p, { bride: "lehenga", groom: "sherwani", coat: "#f3e6cf" });
    },
    live(ctx, p, t) {
        const r = rng(5);
        for (let i = 0; i < 14; i++)
            sparkle(ctx, 140 + r() * 800, 700 + r() * 1100, 10, "#fff6d8", Math.max(0, Math.sin(t * 1.6 + i * 1.3)) * 0.9);
        void p;
    },
};
/** Reception: glam couple under a marquee-bulb arch on a red carpet. */
export const coupleMarquee = {
    still(ctx, p) {
        vGradient(ctx, [[0, darken(p.deep, 0.35)], [0.6, p.deep], [1, darken(p.deep, 0.5)]]);
        // drapes
        for (const x of [0, W - 170]) {
            const g = ctx.createLinearGradient(x, 0, x + 170, 0);
            for (let i = 0; i <= 8; i++)
                g.addColorStop(i / 8, i % 2 ? lighten(p.deep, 0.15) : darken(p.deep, 0.4));
            ctx.fillStyle = g;
            ctx.fillRect(x, 0, 170, H);
        }
        // arch panel
        ctx.fillStyle = darken(p.deep, 0.45);
        ctx.beginPath();
        ctx.moveTo(190, 1880);
        ctx.lineTo(190, 980);
        ctx.arc(540, 980, 350, Math.PI, 0);
        ctx.lineTo(890, 1880);
        ctx.closePath();
        ctx.fill();
        // red carpet
        ctx.fillStyle = mix("#b0101e", p.deep, 0.3);
        ctx.beginPath();
        ctx.moveTo(420, 1500);
        ctx.lineTo(660, 1500);
        ctx.lineTo(900, H);
        ctx.lineTo(180, H);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = alpha("#000000", 0.25);
        ctx.fillRect(0, 1880, W, 40);
        const cols = [p.flower, "#ffffff", lighten(p.flower, 0.4)];
        roseBush(ctx, p, 200, 1840, 260, 6, cols);
        roseBush(ctx, p, 880, 1840, 260, 7, cols);
        couple(ctx, p, { bride: "gown", groom: "tux", coat: "#16161c" });
    },
    live(ctx, p, t) {
        // marquee bulbs around the arch, chasing
        const pts = archPath(540, 380, 600, 1860, 46);
        pts.forEach((pt, i) => bulb(ctx, pt.x, pt.y, 9, "#ffd27a", 0.55 + 0.45 * Math.max(0, Math.sin(t * 4 - i * 0.5))));
        const r = rng(8);
        for (let i = 0; i < 10; i++)
            sparkle(ctx, 300 + r() * 480, 1100 + r() * 700, 9, "#ffffff", Math.max(0, Math.sin(t * 2 + i)) * 0.8);
        void p;
    },
};
/** Haldi: couple in yellow with sunflowers, marigolds and a draped tent. */
export const coupleHaldi = {
    still(ctx, p) {
        vGradient(ctx, [[0, lighten(p.sky, 0.25)], [1, mix(p.sky, "#e9c98a", 0.45)]]);
        // tent drapes
        for (let i = 0; i < 7; i++) {
            const x = i * 180 - 30;
            ctx.fillStyle = i % 2 ? alpha("#fff8e6", 0.9) : alpha(mix("#f6d36b", p.flower, 0.2), 0.75);
            ctx.beginPath();
            ctx.moveTo(x, 600);
            ctx.quadraticCurveTo(x + 90, 680, x + 180, 600);
            ctx.lineTo(x + 170, 1700);
            ctx.lineTo(x + 10, 1700);
            ctx.closePath();
            ctx.fill();
        }
        // floor
        vGradient(ctx, [[0, mix("#d9b27a", p.sky, 0.3)], [1, darken(mix("#c99a5a", p.sky, 0.2), 0.2)]], 1700, H);
        // marigold curtains
        for (let x = 60; x < W; x += 80)
            for (let y = 610; y < 610 + 200 + ((x / 80) % 3) * 60; y += 26)
                marigold(ctx, x, y, 14, (y / 26) % 2 ? mg1(p) : mg2(p), x + y);
        // sunflower vases
        const sun = (x, y, r) => {
            ctx.fillStyle = "#f6b81a";
            for (let k = 0; k < 14; k++) {
                const a = (k / 14) * Math.PI * 2;
                ctx.beginPath();
                ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.55, r * 0.22, a, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = "#5a3210";
            ctx.beginPath();
            ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
            ctx.fill();
        };
        const r = rng(3);
        for (const bx of [110, 970]) {
            ctx.fillStyle = mix("#b8742a", p.deep, 0.2);
            ctx.beginPath();
            ctx.moveTo(bx - 60, 1880);
            ctx.lineTo(bx + 60, 1880);
            ctx.lineTo(bx + 40, 1660);
            ctx.lineTo(bx - 40, 1660);
            ctx.closePath();
            ctx.fill();
            for (let i = 0; i < 8; i++)
                leaf(ctx, bx + (r() - 0.5) * 160, 1560 - r() * 260, 50, 16, r() * 6, leafGreen(p));
            for (let i = 0; i < 6; i++)
                sun(bx + (r() - 0.5) * 170, 1420 + r() * 230, 30 + r() * 12);
        }
        // cushions & candles
        ctx.fillStyle = mix("#f2c14e", p.flower, 0.3);
        ctx.beginPath();
        ctx.ellipse(250, 1860, 90, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = mix("#e8743a", p.flower, 0.2);
        ctx.beginPath();
        ctx.ellipse(830, 1860, 90, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        couple(ctx, p, { bride: "haldi", groom: "kurta", coat: "#f2c230", s: 0.98 });
    },
    live(ctx, p, t) {
        for (const [x, y] of [[300, 1830], [790, 1830], [60, 1870], [1020, 1870]]) {
            ctx.fillStyle = "#fff6e0";
            ctx.fillRect(x - 8, y - 30, 16, 30);
            glow(ctx, x, y - 40, 50, "#ffb347", 0.5 + 0.15 * Math.sin(t * 6 + x));
            ctx.fillStyle = "#ffcf5a";
            ctx.beginPath();
            ctx.ellipse(x, y - 40, 5, 11 + Math.sin(t * 8 + x) * 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        void p;
    },
};
/** Engagement: a starry blue night, the bride in a glittering gown. */
export const coupleStarry = {
    still(ctx, p) {
        vGradient(ctx, [[0, darken(p.deep, 0.4)], [0.6, p.deep], [1, mix(p.deep, p.sky, 0.25)]]);
        const r = rng(2);
        for (let i = 0; i < 220; i++) {
            ctx.fillStyle = alpha("#ffffff", 0.2 + r() * 0.6);
            ctx.beginPath();
            ctx.arc(r() * W, r() * 1300, r() * 1.8 + 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        // palace windows & arches behind
        ctx.fillStyle = alpha(darken(p.deep, 0.5), 0.9);
        ctx.fillRect(0, 1150, W, 770);
        for (let i = 0; i < 5; i++) {
            const x = 60 + i * 225;
            ctx.fillStyle = alpha(darken(p.deep, 0.3), 1);
            ctx.beginPath();
            ctx.moveTo(x, 1700);
            ctx.lineTo(x, 1300);
            ctx.arc(x + 70, 1300, 70, Math.PI, 0);
            ctx.lineTo(x + 140, 1700);
            ctx.closePath();
            ctx.fill();
            glow(ctx, x + 70, 1450, 130, lighten(p.sky, 0.3), 0.18);
        }
        // mist at the floor
        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = alpha(lighten(p.sky, 0.5), 0.07);
            ctx.beginPath();
            ctx.ellipse(r() * W, 1820 + r() * 80, 260, 70, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        couple(ctx, p, { bride: "gown", groom: "tux", coat: "#151821" });
    },
    live(ctx, p, t) {
        const r = rng(6);
        for (let i = 0; i < 26; i++)
            sparkle(ctx, r() * W, 80 + r() * 1700, 8 + r() * 6, i % 3 ? "#ffffff" : lighten(p.flower, 0.5), Math.max(0, Math.sin(t * 1.5 + i * 1.7)) * 0.9);
        // glittering gown hem
        for (let i = 0; i < 16; i++)
            sparkle(ctx, 300 + r() * 240, 1700 + r() * 180, 6, "#ffffff", Math.max(0, Math.sin(t * 3 + i)) * 0.9);
    },
};
function parasol(ctx, x, y, r, cols, gold) {
    for (let i = 0; i < 12; i++) {
        const a1 = Math.PI + (i / 12) * Math.PI, a2 = Math.PI + ((i + 1) / 12) * Math.PI;
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, r, a1, a2);
        ctx.closePath();
        ctx.fill();
    }
    ctx.fillStyle = gold;
    for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r + 8, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, Math.max(600, y - r - 400));
    ctx.stroke();
}
/** Mehndi: bride in green with a pink dupatta, parasols and a garden. */
export const coupleMehndi = {
    still(ctx, p) {
        vGradient(ctx, [[0, lighten(p.sky, 0.3)], [0.7, mix(p.sky, "#cfe8c4", 0.4)], [0.78, mix("#7fb35a", p.deep, 0.1)], [1, darken(mix("#5f8f45", p.deep, 0.1), 0.15)]]);
        const cols = [mix("#e8478a", p.sky, 0.1), mix("#2fa86a", p.sky, 0.1), mix("#f6b81a", p.sky, 0.1), mix("#7a3ad6", p.sky, 0.15), mix("#ff7a3c", p.sky, 0.1)];
        const pr = rng(4);
        [[150, 760, 120], [420, 680, 90], [700, 720, 110], [950, 800, 125], [300, 900, 70], [840, 940, 80]].forEach(([x, y, r], i) => parasol(ctx, x, y, r, [cols[i % 5], cols[(i + 2) % 5]], p.accent));
        // hedges with flowers
        for (const [x, w] of [[120, 300], [960, 300]]) {
            for (let i = 0; i < 30; i++)
                leaf(ctx, x + (pr() - 0.5) * w, 1640 + pr() * 200, 50, 18, pr() * 6, i % 2 ? leafGreen(p) : darken(leafGreen(p), 0.2));
            for (let i = 0; i < 16; i++)
                rose(ctx, x + (pr() - 0.5) * w, 1640 + pr() * 200, 16 + pr() * 12, cols[i % 3], pr() * 6);
        }
        // cushions
        ctx.fillStyle = cols[0];
        ctx.beginPath();
        ctx.ellipse(230, 1870, 90, 36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = cols[2];
        ctx.beginPath();
        ctx.ellipse(860, 1870, 90, 36, 0, 0, Math.PI * 2);
        ctx.fill();
        couple(ctx, p, { bride: "lehenga", groom: "kurta", coat: mix("#f6d6e2", p.sky, 0.2), dupatta: mix("#e8478a", p.flower, 0.2) });
    },
    live(ctx, p, t) {
        const r = rng(12);
        for (let i = 0; i < 12; i++)
            sparkle(ctx, 80 + r() * 920, 650 + r() * 1100, 9, "#fff6d8", Math.max(0, Math.sin(t * 1.5 + i)) * 0.85);
        void p;
    },
};
/** Sangeet: dancing night with fairy lights, spotlights and a dhol. */
export const coupleSangeet = {
    still(ctx, p) {
        vGradient(ctx, [[0, darken(p.deep, 0.4)], [0.65, p.deep], [0.8, darken(p.deep, 0.2)], [1, darken(p.deep, 0.55)]]);
        // spotlight cones
        for (const [x, a] of [[200, 0.35], [880, -0.35]]) {
            ctx.save();
            ctx.translate(x, 560);
            ctx.rotate(a);
            const g = ctx.createLinearGradient(0, 0, 0, 1300);
            g.addColorStop(0, alpha("#fff3d0", 0.35));
            g.addColorStop(1, alpha("#fff3d0", 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.lineTo(20, 0);
            ctx.lineTo(260, 1300);
            ctx.lineTo(-260, 1300);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        // stage floor
        ctx.fillStyle = darken(p.deep, 0.5);
        ctx.fillRect(0, 1720, W, 200);
        ctx.fillStyle = goldGradient(ctx, 0, 0, W, 0, p.accent);
        ctx.fillRect(0, 1716, W, 6);
        // dhol on the left
        const dx = 130, dy = 1760;
        ctx.fillStyle = mix("#b0402a", p.deep, 0.2);
        ctx.beginPath();
        ctx.ellipse(dx, dy, 90, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f3e2c0";
        ctx.beginPath();
        ctx.ellipse(dx - 80, dy, 22, 58, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 3;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(dx - 70, dy + i * 16);
            ctx.lineTo(dx + 80, dy - i * 16);
            ctx.stroke();
        }
        couple(ctx, p, { bride: "lehenga", groom: "bandhgala", coat: "#17151d" });
    },
    live(ctx, p, t) {
        const cols = ["#ffd27a", "#ff8ac8", "#8ad8ff", "#c8ff8a"];
        for (let k = 0; k < 3; k++) {
            const pts = hangPoints(-20, 600 + k * 70, W + 20, 640 + k * 70, 120 + k * 20, 40);
            pts.forEach((q, i) => bulb(ctx, q.x, q.y, 6, cols[(i + k) % 4], 0.5 + 0.5 * Math.max(0, Math.sin(t * 3 + i * 0.7 + k))));
        }
        const r = rng(3);
        for (let i = 0; i < 16; i++)
            sparkle(ctx, r() * W, 700 + r() * 1100, 8, "#ffffff", Math.max(0, Math.sin(t * 2.2 + i * 1.4)) * 0.9);
        void p;
    },
};
/** South Indian: Kanjivaram saree and veshti before a temple gopuram. */
export const coupleSouth = {
    still(ctx, p) {
        vGradient(ctx, [[0, lighten(p.sky, 0.25)], [0.6, mix(p.sky, "#ffd8a0", 0.4)], [1, mix("#e8c08a", p.sky, 0.3)]]);
        gopuram(ctx, 540, 1500, 520, 820, alpha(mix("#d8a46a", p.sky, 0.35), 0.9), p.accent);
        // stone floor + kolam
        vGradient(ctx, [[0, mix("#e6cfa6", p.sky, 0.3)], [1, darken(mix("#d6b88a", p.sky, 0.2), 0.12)]], 1500, H);
        ctx.strokeStyle = alpha("#ffffff", 0.85);
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(540, 1880, 420 - i * 60, 50 - i * 8, 0, Math.PI, 0);
            ctx.stroke();
        }
        // banana trees
        for (const [x, f] of [[60, 1], [1020, -1]]) {
            ctx.fillStyle = mix("#7a9a3a", p.deep, 0.1);
            ctx.fillRect(x - 14, 1100, 28, 780);
            for (let i = 0; i < 6; i++)
                bananaLeaf(ctx, x, 1150 + i * 40, 300, (i % 2 ? -0.6 : 0.6) * f - Math.PI / 2 * (i % 3 === 0 ? 1 : 0.8), mix("#4f8f3a", p.deep, 0.1), i % 2 ? 1 : -1);
        }
        // marigold thoranam across the top of the picture
        const pts = hangPoints(0, 700, W, 700, 80, 34);
        pts.forEach((q, i) => marigold(ctx, q.x, q.y, 16, i % 2 ? mg1(p) : mg2(p), i));
        couple(ctx, p, { bride: "saree", groom: "veshti", coat: "#fffaf0", dupatta: p.flower });
    },
    live(ctx, p, t) {
        // brass lamps
        for (const x of [170, 910]) {
            ctx.fillStyle = goldGradient(ctx, x - 30, 0, x + 30, 0, p.accent);
            ctx.fillRect(x - 6, 1640, 12, 220);
            ctx.beginPath();
            ctx.ellipse(x, 1640, 46, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x, 1866, 40, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            for (const dx of [-36, 0, 36]) {
                glow(ctx, x + dx, 1612, 46, "#ffb347", 0.5 + 0.12 * Math.sin(t * 7 + dx));
                ctx.fillStyle = "#ffd25a";
                ctx.beginPath();
                ctx.ellipse(x + dx, 1614, 6, 14 + Math.sin(t * 9 + dx) * 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },
};
/** Nikah: ivory couple under Mughal arches with brass lanterns and a crescent moon. */
export const coupleNikah = {
    still(ctx, p) {
        vGradient(ctx, [[0, darken(p.deep, 0.4)], [0.6, p.deep], [1, darken(p.deep, 0.35)]]);
        glow(ctx, 540, 1200, 600, lighten(p.sky, 0.3), 0.25);
        ctx.fillStyle = "#fff4d6";
        ctx.beginPath();
        ctx.arc(850, 760, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = darken(p.deep, 0.4);
        ctx.beginPath();
        ctx.arc(875, 745, 56, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = goldGradient(ctx, 0, 0, W, 0, p.accent);
        ctx.lineWidth = 7;
        ogeeArch(ctx, 150, 930, 820, 1880);
        ctx.stroke();
        ctx.lineWidth = 3;
        ogeeArch(ctx, 180, 900, 860, 1880);
        ctx.stroke();
        // marble floor
        vGradient(ctx, [[0, mix("#e8e0d0", p.deep, 0.6)], [1, mix("#e8e0d0", p.deep, 0.8)]], 1760, H);
        const cols = ["#ffffff", lighten(p.flower, 0.3), "#f6c8d0"];
        roseBush(ctx, p, 120, 1850, 220, 8, cols);
        roseBush(ctx, p, 960, 1850, 220, 9, cols);
        couple(ctx, p, { bride: "lehenga", groom: "bandhgala", coat: mix("#f3e6cf", p.flower, 0.15) });
    },
    live(ctx, p, t) {
        for (const [x, y] of [[90, 900], [990, 900], [90, 1260], [990, 1260]])
            fanoos(ctx, p, x, y, 0.8, t);
        const r = rng(14);
        for (let i = 0; i < 12; i++)
            sparkle(ctx, r() * W, 650 + r() * 300, 8, "#ffffff", Math.max(0, Math.sin(t * 1.6 + i)) * 0.8);
    },
};
