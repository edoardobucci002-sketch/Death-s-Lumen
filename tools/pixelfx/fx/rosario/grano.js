// Death's Lumen: il grano del Rosario spezzato in volo, visto dall'alto. Una perla scura di vetro viola: lucida in alto
// a sinistra, il bordo scuro in basso a destra, un riflesso che gira mentre ruota e un capo di cordicella spezzata.
// Rotondo, così vale per ogni direzione (il volo e la scia li fa il gioco).
import { fit, TAU } from "../../../../../pixelfx/src/core/index.js";

export const meta = {
  name: "Grano del Rosario",
  desc: "A dark violet glass rosary bead in flight seen from above: lit top-left, a dark lip bottom-right, a glint that circles as it spins and a frayed end of broken cord whipping behind.",
  tags: ["projectile", "bead", "rosary", "loop"],
  size: [20, 20],
  origin: [10, 10],
  duration: 0.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#120a1c", "#241436", "#3c2260", "#5a3690", "#7e52c0", "#a57ae0", "#d4bcf6", "#ffffff"], r: 4.5 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 8), R = o.r, w = (TAU * t) / meta.duration;
  // la cordicella spezzata: tre pixel che frustano dietro il grano, girando con lui
  for (let k = 1; k <= 3; k++) {
    const a = w + Math.PI + Math.sin(w * 2) * 0.4, d = R + k;
    p.px(Math.cos(a) * d, Math.sin(a) * d, k === 3 ? C[2] : C[3]);
  }
  p.shade(-R - 2, -R - 2, R + 2, R + 2, (x, y) => {
    const d = Math.hypot(x, y);
    if (d > R + 1) return;
    if (d > R) return C[0]; // contorno scuro
    if (d > R - 1.2 && x + y > R * 0.4) return C[1]; // labbro in basso a destra
    const s = Math.hypot(x + R * 0.4, y + R * 0.4) / R; // distanza dal punto lucido
    if (s < 0.22) return C[7];
    if (s < 0.45) return C[6];
    if (x + y > R * 0.5) return C[3];
    if (s < 0.95) return C[5];
    return C[4];
  });
  // il riflesso che gira sul bordo mentre il grano ruota
  const ga = w * 2;
  p.px(Math.cos(ga) * (R - 1.5), Math.sin(ga) * (R - 1.5), C[6]);
}
