"use client";
import { useEffect, useRef, useState } from "react";
import s from "./SgEnvelope.module.css";

/*
  Opening screen: the envelope film waits on its first frame with "Tap to open". On tap it plays full
  screen with the music and fades out just before it ends to reveal the page; then a round play / pause
  button for the music appears.

  monogram + sealTrack: paints the couple's letters on the film's wax seal. sealTrack lists, for moments
  of the film, where the seal is: [time s, centre x, centre y, radius x, radius y, strength] with x, y and
  radii as parts of the film's width / height (see envelope-track.js). The seal's own colours are read
  from each frame, so the letters glow along with the seal.
*/

const SCRIPT = '"Pinyon Script", "Great Vibes", cursive';

/** seal position at time t, blended between the two nearest samples */
function sealAt(track, t) {
  let i = 0;
  while (i < track.length - 2 && track[i + 1][0] <= t) i++;
  const a = track[i], b = track[i + 1] ?? a;
  if (a[1] == null || b[1] == null) return a[1] == null ? null : a;
  const k = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 0;
  return a.map((v, j) => v + (b[j] - v) * k);
}

/** average colour of the pixels that pass `keep` inside a ring of the sample image */
function ringColour(px, w, h, cx, cy, rx, ry, r0, r1, keep) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let a = 0; a < 360; a += 6) for (let f = r0; f <= r1; f += 0.04) {
    const x = Math.round(cx + Math.cos(a * Math.PI / 180) * rx * f), y = Math.round(cy + Math.sin(a * Math.PI / 180) * ry * f);
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const i = (y * w + x) * 4;
    if (!keep(px[i], px[i + 1], px[i + 2])) continue;
    r += px[i]; g += px[i + 1]; b += px[i + 2]; n++;
  }
  return n ? [r / n, g / n, b / n] : null;
}

const rgb = ([r, g, b], k = 1, a = 1) => `rgba(${Math.min(255, r * k) | 0}, ${Math.min(255, g * k) | 0}, ${Math.min(255, b * k) | 0}, ${a})`;

export default function SgEnvelope({ video, music, tapLabel = "Tap to open", monogram, sealTrack, onOpen, onDone }) {
  const [phase, setPhase] = useState("closed"); // closed → playing → leaving → done
  const [playing, setPlaying] = useState(false);
  const film = useRef(null);
  const paint = useRef(null);
  const audio = useRef(null);
  const unlocked = useRef(false);
  const ended = useRef(false);

  const finish = () => {
    if (ended.current) return;
    ended.current = true;
    setPhase("leaving");
    window.setTimeout(() => { setPhase("done"); onDone?.(); }, 1400);
  };
  // Android only lets sound start from a click, so the first touch quietly primes the audio
  const prime = () => {
    if (unlocked.current || !audio.current) return;
    unlocked.current = true;
    audio.current.play()?.then(() => { audio.current.pause(); audio.current.currentTime = 0; }).catch(() => {});
  };
  const open = () => {
    if (phase !== "closed") return;
    setPhase("playing");
    onOpen?.();
    if (film.current) film.current.play()?.catch(finish);
    else finish();
    if (audio.current) { audio.current.volume = 1; audio.current.play()?.then(() => setPlaying(true)).catch(() => {}); }
  };
  const onTime = () => {
    const v = film.current;
    if (v?.duration && v.currentTime >= v.duration - 0.8) finish();
  };
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play()?.then(() => setPlaying(true)).catch(() => {});
    else { a.pause(); setPlaying(false); }
  };

  // paint the couple's letters over the seal, frame by frame
  useEffect(() => {
    const v = film.current, c = paint.current;
    if (!v || !c || !monogram || !sealTrack?.length || phase === "done") return undefined;
    const [first, second] = monogram.split("&").map((p) => p.trim());
    const sample = document.createElement("canvas");
    sample.width = 180; sample.height = 320;
    const sx = sample.getContext("2d", { willReadFrequently: true });
    const x = c.getContext("2d");
    let raf = 0, stopped = false, fontReady = false;
    document.fonts?.load(`64px ${SCRIPT}`).then(() => { fontReady = true; }).catch(() => { fontReady = true; });

    const draw = () => {
      if (stopped) return;
      raf = requestAnimationFrame(draw);
      const box = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== Math.round(box.width * dpr)) { c.width = Math.round(box.width * dpr); c.height = Math.round(box.height * dpr); }
      x.clearRect(0, 0, c.width, c.height);
      if (!fontReady || v.readyState < 2) return;
      const seal = sealAt(sealTrack, v.currentTime);
      if (!seal) return;
      const [, fx, fy, frx, fry, strength] = seal;
      // read the seal's wax and gold from this very frame
      sx.drawImage(v, 0, 0, sample.width, sample.height);
      const px = sx.getImageData(0, 0, sample.width, sample.height).data;
      const scx = fx * sample.width, scy = fy * sample.height, srx = frx * sample.width, sry = fry * sample.width;
      const wax = ringColour(px, sample.width, sample.height, scx, scy, srx, sry, 0.6, 0.74, (r, g, b) => r - g > 40 && r - b > 30);
      const gold = ringColour(px, sample.width, sample.height, scx, scy, srx, sry, 0.05, 0.5, (r, g, b) => r > 150 && g > 100 && r - b > 40);
      if (!wax) return;
      const cx = fx * c.width, cy = fy * c.height, rx = frx * c.width, ry = fry * c.width;
      const alpha = Math.min(1, strength / (sealTrack[0][5] || strength));
      x.save();
      x.globalAlpha = alpha;
      x.translate(cx, cy);
      x.scale(1, ry / rx);
      // cover the film's letters with the seal's own wax, feathered into the pressed ring
      const fill = x.createRadialGradient(0, -rx * 0.12, rx * 0.05, 0, 0, rx * 0.62);
      fill.addColorStop(0, rgb(wax, 1.12));
      fill.addColorStop(0.78, rgb(wax, 1));
      fill.addColorStop(1, rgb(wax, 1, 0));
      x.fillStyle = fill;
      x.beginPath(); x.arc(0, 0, rx * 0.62, 0, Math.PI * 2); x.fill();
      // the couple's letters, pressed into the wax
      const g = gold ?? [214, 176, 108];
      const size = rx * 0.7;
      x.font = `${size}px ${SCRIPT}`;
      x.textBaseline = "middle";
      const amp = second ? "&" : "";
      const smallFont = `${size * 0.6}px ${SCRIPT}`;
      const parts = [[first, x.font], [amp, smallFont], [second ?? "", x.font]];
      const widths = parts.map(([t, f]) => { x.font = f; return x.measureText(t).width; });
      let left = -(widths[0] + widths[1] * 0.8 + widths[2]) / 2;
      parts.forEach(([t, f], i) => {
        x.font = f;
        const dy = i === 1 ? size * 0.12 : 0;
        // a dark edge below, then the gold letter drawn with a fine outline so it reads as thick as the film's
        x.lineJoin = "round";
        x.lineWidth = size * 0.05;
        x.strokeStyle = "rgba(40, 6, 8, 0.5)"; x.strokeText(t, left + size * 0.02, dy + size * 0.045);
        x.fillStyle = "rgba(40, 6, 8, 0.55)"; x.fillText(t, left + size * 0.02, dy + size * 0.045);
        const shine = x.createLinearGradient(0, -size / 2, 0, size / 2);
        shine.addColorStop(0, rgb(g, 1.2)); shine.addColorStop(0.55, rgb(g, 1)); shine.addColorStop(1, rgb(g, 0.82));
        x.lineWidth = size * 0.035;
        x.strokeStyle = shine; x.strokeText(t, left, dy);
        x.fillStyle = shine; x.fillText(t, left, dy);
        left += widths[i] * (i === 1 ? 0.8 : 1) - (i === 0 ? size * 0.06 : 0);
      });
      x.restore();
    };
    draw();
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [monogram, sealTrack, phase]);

  return <>
    {music && <audio ref={audio} src={music} loop preload="auto" />}
    {phase !== "done" && <div className={`${s.stage} ${phase === "leaving" ? s.out : ""}`} onClick={open} onTouchStart={prime}>
      <div className={s.box}>
        <video ref={film} className={s.film} src={video} muted playsInline preload="auto" onTimeUpdate={onTime} onEnded={finish}
          onError={phase === "playing" ? finish : undefined} aria-label="Open your invitation" />
        {monogram && sealTrack && <canvas ref={paint} className={s.paint} aria-hidden="true" />}
      </div>
      {phase === "closed" && <div className={s.tap}><i className={s.chev} aria-hidden="true" /><span>{tapLabel}</span></div>}
    </div>}
    {music && phase === "done" && <button type="button" className={s.audio} onClick={toggle} aria-label={playing ? "Pause music" : "Play music"}>
      {playing
        ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="5,3 19,12 5,21" /></svg>}
    </button>}
  </>;
}
