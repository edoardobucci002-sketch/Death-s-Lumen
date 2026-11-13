// Death's Lumen: lo scoppio del grumo di cera e la pozza che lascia, visti dall'alto (ellisse 2:1 come gli sprite del
// gioco). Un lampo chiaro, una corona di gocce che volano e ricadono in macchioline intorno; la pozza si allarga di
// colpo, si assesta con un bordo irregolare, la luce le scorre sopra e qualche bolla si gonfia e scoppia; alla fine la
// cera si rapprende, schiarisce e si ritira a retino fino a sparire. Dura quanto la pozza nel gioco (o.durata).
import { fit, rng, ease, smooth, clamp, TAU } from "../../../../../pixelfx/src/core/index.js";

export const meta = {
  name: "Pozza di cera",
  desc: "Grey-blue wax bursts on the floor seen from above: a crown of droplets, a puddle with a lumpy rim, sheen and bubbles; then it sets and dithers away.",
  tags: ["ground", "puddle", "wax", "splash", "hazard"],
  size: [112, 72],
  origin: [56, 40],
  duration: 2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0e1214", "#1c2428", "#2a3238", "#46545e", "#6d7f8c", "#8ea2b0", "#b8cad6", "#e8f0f4"], r: 34, seed: 7 },
};

const SY = 0.5; // la pozza sta sul pavimento: alta la metà di quanto è larga

export function draw(p, t, o) {
  const C = fit(o.palette, 8), R = o.r, D = meta.duration, g = rng(o.seed);
  const ph = Array.from({ length: 4 }, () => g.range(0, TAU));
  // gocce della corona: angolo, velocità, altezza del volo; dove ricadono lasciano una macchiolina
  const gocce = Array.from({ length: 14 }, () => ({ a: g.range(0, TAU), v: g.range(0.75, 1.35), h: g.range(10, 22), s: g.range(0.8, 1.6) }));
  const bolle = Array.from({ length: 3 }, () => ({ x: g.range(-0.5, 0.5), y: g.range(-0.4, 0.4), t0: g.range(0.45, 1.3), dur: g.range(0.35, 0.55) }));
  const fine = smooth(D - 0.55, D - 0.02, t); // 0 → 1: la cera si rapprende e sparisce
  const allarga = ease.outCubic(clamp(t / 0.22, 0, 1));
  const rr = R * (0.15 + 0.85 * allarga) * (1 - 0.25 * fine);
  const bordo = (a) => rr * (1 + 0.08 * Math.sin(3 * a + ph[0]) + 0.06 * Math.sin(5 * a + ph[1]) + 0.04 * Math.sin(8 * a + ph[2] + t * 1.5));
  const vela = (x, y) => (fine > 0 ? 1 - fine : 1); // quanto resta (sotto 1 diventa retino)

  // la pozza
  p.shade(-R - 4, -R * SY - 4, R + 4, R * SY + 4, (x, y, out) => {
    const z = y / SY, d = Math.hypot(x, z), a = Math.atan2(z, x), b = bordo(a);
    if (d > b + 1.2) return;
    let c;
    const verso = (x * 0.6 + z * 0.8) / Math.max(1, d); // -1 dal lato della luce (in alto a sinistra), +1 dal lato opposto
    if (d > b) c = C[1]; // contorno scuro
    else if (d > b - 2.2 && verso > 0.1) c = C[2]; // labbro scuro dal lato opposto alla luce
    else if (d > b - 2.2 && verso < -0.35) c = C[6]; // bordo lucido verso la luce
    else {
      // riflessi: due strisce sottili e curve che scorrono piano sulla superficie bagnata
      const riflesso = Math.sin((x * 0.55 - z * 0.35) * 0.32 - t * 1.6 + ph[3]) + 0.35 * Math.sin(d * 0.4 + ph[2]);
      if (verso < 0.2 && d < b * 0.8 && riflesso > 1.15) c = fine > 0.3 ? C[6] : C[7];
      else if (verso < 0.2 && d < b * 0.85 && riflesso > 0.9) c = C[6];
      else if (d > b * 0.7 && verso > 0.3) c = C[3];
      else c = C[4];
    }
    if (fine > 0.4 && d > b - 3 && d <= b) c = C[5]; // il bordo si rapprende e schiarisce
    out.c = c;
    out.a = vela(x, y);
  });

  // le bolle: si gonfiano, un punto di luce, scoppiano lasciando un anellino
  for (const b of bolle) {
    const u = (t - b.t0) / b.dur;
    if (u < 0 || u > 1.15 || fine > 0.5) continue;
    const x = b.x * rr, y = b.y * rr * SY;
    if (u <= 1) {
      const s = 1 + 2.2 * Math.sin(Math.PI * u * 0.5);
      p.ellipse(x, y, s, s * 0.8, C[5]);
      p.px(x - 1, y - 1, C[7]);
    } else {
      p.ring(x, y, 3, 1, C[6]);
    }
  }

  // il lampo dell'impatto
  if (t < 0.1) {
    const k = 1 - t / 0.1;
    p.ellipse(0, 0, 6 * k + 2, (6 * k + 2) * SY, C[7]);
  }

  // la corona di gocce: volano fuori e ricadono; dove toccano terra restano macchioline che poi seguono la pozza
  for (const q of gocce) {
    const volo = 0.42 * q.v, u = t / volo;
    const dist = R * (0.45 + 0.75 * q.v) * Math.min(1, u);
    const gx = Math.cos(q.a) * dist, gy = Math.sin(q.a) * dist * SY;
    if (u < 1) {
      const h = q.h * 4 * u * (1 - u); // arco di volo
      p.px(gx, gy - h, u < 0.3 ? C[7] : C[6]);
      if (q.s > 1.2) p.px(gx + 1, gy - h, C[5]);
      if (u > 0.15 && dist > rr * 1.08) p.px(gx, gy, C[1]); // l'ombra a terra, fuori dalla pozza
    } else if (fine < 0.98) {
      p.ellipse(gx, gy, q.s, q.s * SY + 0.3, C[4], 1 - fine);
      p.px(gx - 1, gy, C[6]);
    }
  }
}
