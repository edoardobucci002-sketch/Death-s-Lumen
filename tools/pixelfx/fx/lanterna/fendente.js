// Death's Lumen: il fendente di luce della Lanterna nel gioco a stanze, visto dall'alto. Una mezzaluna dorata spazza
// l'arco del colpo dall'alto in basso (il personaggio guarda a destra) in pochi centesimi: bordo bianco mentre è giovane,
// poi si raffredda verso l'ambra e si sfalda a retino dalla coda; resta un attimo una traccia a puntini sul bordo
// dell'area, e qualche favilla vola via dalla punta. Il raggio (o.r) e l'ampiezza (o.amp, gradi) sono quelli veri del
// colpo; o.dir (gradi) gira l'effetto: il gioco usa 0, 22,5 e 45 e ottiene le altre 13 direzioni ribaltandolo e girandolo di
// 90° esatti, che non spostano i pixel.
// Ricetta della mezzaluna adattata da melee/sword-slash di pixelfx (MIT, Hugo Duprez / Sprite Fusion).
import { fit, rng, ease, smooth, clamp, TAU } from "../../../../../pixelfx/src/core/index.js";

export const meta = {
  name: "Fendente della Lanterna",
  desc: "A golden crescent of light sweeps the strike's arc top to bottom seen from above, white at the rim, cooling to amber and dithering away from the tail, with a dotted trace and a few embers off the tip.",
  tags: ["melee", "slash", "light", "holy", "top-down", "one-shot"],
  size: [304, 304],
  origin: [152, 152],
  duration: 0.3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
    r: 136,
    amp: 132,
    dir: 0,
    seed: 5,
  },
};

const SWEEP = 0.07; // secondi in cui la testa percorre tutto l'arco
const HOLD = 0.03; // la mezzaluna resta intera un attimo
const TRAIL = 0.17; // poi la coda la raggiunge e la consuma

export function draw(p, t, o) {
  const C = fit(o.palette, 8), n = C.length, R = o.r, half = (o.amp / 2) * (Math.PI / 180), dir = (o.dir * Math.PI) / 180;
  const a0 = -half, span = 2 * half; // dall'alto (angolo negativo, y verso il basso) al basso
  const head = ease.outExpo(clamp(t / SWEEP)), tail = smooth(SWEEP + HOLD, SWEEP + HOLD + TRAIL, t);
  const age = clamp(t / (SWEEP + HOLD + TRAIL));
  const W = Math.max(6, R * 0.2) * (1 - tail * 0.5); // spessore massimo della mezzaluna
  const c = Math.cos(dir), s = Math.sin(dir), B = R + 3;

  // la mezzaluna: più spessa dietro la testa, sottile verso la coda; bianca sul bordo esterno finché è giovane
  if (tail < 1 && head > 0.01) {
    const da = a0 + span * tail, L = span * (head - tail);
    p.shade(-B, -B, B, B, (x, y, out) => {
      const lx = x * c + y * s, ly = -x * s + y * c, r = Math.hypot(lx, ly);
      if (r > R + 0.5 || r < R - W - 1) return;
      const u = Math.atan2(ly, lx) - da;
      if (u < 0 || u > L) return;
      const v = u / Math.max(L, 1e-3); // 0 coda, 1 testa
      const w = W * Math.pow(Math.sin(Math.PI * Math.pow(v, 1.8) * 0.92 + 0.08), 0.7);
      if (w < 0.6) return;
      const q = (R - r) / w; // 0 sul bordo esterno, 1 all'interno
      if (q < 0 || q > 1) return;
      const ci = q < 0.18 && age < 0.45 ? 0 : Math.round(q * (n - 1) * 0.7 + age * 2.6 - v * 0.9 + 0.5);
      out.c = C[n - 1 - clamp(ci, 0, n - 2)];
      out.a = Math.min(1, v / 0.35) * (1 - tail * 0.6);
    });
  }

  // la traccia a puntini sul bordo dell'area, dove la mezzaluna è già passata
  const th = 1 - clamp((t - SWEEP - HOLD) / (TRAIL + 0.05));
  if (head > 0.05 && th > 0)
    for (let k = 0; k <= head; k += 1.5 / (span * R)) {
      const a = a0 + span * k, x = Math.cos(a) * (R - 0.5), y = Math.sin(a) * (R - 0.5);
      p.dot(x * c - y * s, x * s + y * c, C[3], th * (0.35 + 0.65 * k));
    }

  // faville dalla punta, quando la testa arriva in fondo
  const g = rng(o.seed), tf = t - SWEEP * 0.8;
  const ta = a0 + span, tx = Math.cos(ta) * (R - W * 0.3), ty = Math.sin(ta) * (R - W * 0.3);
  for (let i = 0; i < 16; i++) {
    const a = ta + Math.PI / 2 + g.range(-0.8, 0.6), sp = g.range(80, 260), life = g.range(0.12, 0.24);
    if (tf <= 0 || tf > life) continue;
    const d = sp * tf * (1 - (0.5 * tf) / life), x = tx + Math.cos(a) * d, y = ty + Math.sin(a) * d;
    const px = x * c - y * s, py = x * s + y * c, col = C[i % 3 ? 6 : 7], al = 1 - (0.6 * tf) / life;
    p.dot(px, py, col, al);
    if (i % 2 === 0) p.dot(px + 1, py, col, al), p.dot(px, py + 1, col, al); // le faville più grosse: 2 pixel
  }
}
