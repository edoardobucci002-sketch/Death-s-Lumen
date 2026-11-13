// Death's Lumen: il grumo di cera del Cantore in volo, visto dall'alto. Una goccia densa che ribolle: il bordo si
// gonfia e si sgonfia, la luce la prende in alto a sinistra, l'ombra in basso a destra; due perline le girano intorno.
// Rotondo, così vale per ogni direzione (la scia la disegna il gioco).
import { fit, rng, TAU } from "../../../../../pixelfx/src/core/index.js";

export const meta = {
  name: "Grumo di cera",
  desc: "A dense bead of grey-blue wax in flight seen from above: its rim swells and churns, lit top-left, a dark lip bottom-right, two droplets wobbling round it.",
  tags: ["projectile", "wax", "blob", "loop"],
  size: [32, 32],
  origin: [16, 16],
  duration: 0.5,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0e1214", "#1c2428", "#2a3238", "#46545e", "#6d7f8c", "#8ea2b0", "#b8cad6", "#e8f0f4"], r: 9, seed: 4 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 8), R = o.r, w = (TAU * t) / meta.duration, g = rng(o.seed);
  const ph = [g.range(0, TAU), g.range(0, TAU), g.range(0, TAU)];
  // il bordo: un raggio che cambia con l'angolo e nel tempo (onde intere: il giro si chiude senza salti)
  const bordo = (a) => R * (1 + 0.05 * Math.sin(3 * a + w + ph[0]) + 0.035 * Math.sin(5 * a - 2 * w + ph[1]) + 0.025 * Math.sin(2 * a + w + ph[2]));
  // il punto più lucido, che si sposta appena mentre la goccia ribolle
  const lx = -R * 0.38 + Math.sin(w) * 0.6, ly = -R * 0.42 + Math.cos(w) * 0.6;
  p.shade(-R - 3, -R - 3, R + 3, R + 3, (x, y) => {
    const d = Math.hypot(x, y), a = Math.atan2(y, x), b = bordo(a);
    if (d > b + 1) return;
    if (d > b) return C[0]; // contorno scuro
    const s = Math.hypot(x - lx, y - ly) / R; // distanza dal punto lucido
    if (s < 0.14) return C[7];
    if (s < 0.32) return C[6];
    if (d > b - 1.5 && x + y > R * 0.3) return C[2]; // labbro scuro in basso a destra
    if (x + y > R * 0.55) return C[3];
    if (s < 0.75) return C[5];
    return C[4];
  });
  // due perline che girano intorno, un po' staccate
  for (let i = 0; i < 2; i++) {
    const a = w * (i ? -1 : 1) + ph[i] * 2, r = R + 2 + Math.sin(w * 2 + i) * 1.2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    p.px(x, y, C[5]);
    p.px(x + 1, y, C[3]);
  }
}
