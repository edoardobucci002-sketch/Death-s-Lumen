// Death's Lumen: il colpo del grano del Rosario spezzato su un nemico, visto dall'alto. Un lampo bianco, una croce di luce
// (più lunga in verticale) che scatta grande e si assottiglia, un anello viola che si allarga e si rompe a pezzi, sei
// perline di vetro che schizzano via frenando e si spengono, due lucciole che restano un attimo. Breve: i rimbalzi sono fitti.
import { fit, rng, TAU, ease, seg, clamp } from "../../../../../pixelfx/src/core/index.js";

export const meta = {
  name: "Colpo del grano",
  desc: "A rosary bead strikes, seen from above: a white flash, a cross of light that snaps big and thins out, a violet ring that widens and breaks apart, six glass beads that skid off and wink out, two motes that linger.",
  tags: ["impact", "hit", "curse", "rosary", "one-shot"],
  size: [52, 52],
  origin: [26, 26],
  duration: 0.42,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#120a1c", "#241436", "#3c2260", "#5a3690", "#7e52c0", "#a57ae0", "#d4bcf6", "#ffffff"], seed: 7 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 8), g = rng(o.seed);
  // 1) lampo: due fotogrammi pieni, poi il cuore che si spegne
  if (t < 0.035) p.disc(0, 0, 5, C[7], 1);
  else if (t < 0.09) { p.disc(0, 0, 4, C[6], 1); p.disc(0, 0, 2, C[7], 1); }
  else if (t < 0.14) p.disc(0, 0, 2, C[5], 1);
  // 2) la croce: scatta grande (oltre misura), poi si accorcia e si fa sottile
  const kc = seg(t, 0, 0.22);
  if (kc < 1) {
    const s = kc < 0.15 ? 1.2 : 1.2 - 0.9 * ease.outQuad((kc - 0.15) / 0.85);
    const up = Math.round(11 * s), dn = Math.round(15 * s), lat = Math.round(8 * s);
    const col = kc < 0.3 ? C[7] : kc < 0.6 ? C[6] : C[5];
    p.line(0, -up, 0, dn, col);
    p.line(-lat, -3, lat, -3, col);
    if (kc < 0.45) { p.line(1, -up + 2, 1, dn - 3, C[6]); p.line(-lat + 2, -2, lat - 2, -2, C[6]); }
  }
  // 3) l'anello: si allarga in fretta e si rompe in archi che si accorciano
  const kr = seg(t, 0.02, 0.3);
  if (kr > 0 && kr < 1) {
    const r = 4 + 16 * ease.outCubic(kr), pezzi = 6, vuoto = 0.25 + 0.6 * kr;
    for (let i = 0; i < pezzi; i++) {
      const a0 = (i / pezzi) * TAU + 0.3, a1 = a0 + (TAU / pezzi) * (1 - vuoto);
      p.arc(0, 0, r, kr < 0.5 ? 2 : 1, a0, a1, kr < 0.35 ? C[6] : kr < 0.7 ? C[5] : C[4]);
    }
  }
  // 4) sei perline che schizzano via, frenano e si spengono
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + g.range(-0.35, 0.35), v = g.range(17, 23), t0 = g.range(0, 0.04), vita = g.range(0.26, 0.36);
    const k = seg(t, t0, t0 + vita);
    if (k <= 0 || k >= 1) continue;
    const d = 3 + v * ease.outQuart(k), x = Math.cos(a) * d, y = Math.sin(a) * d * 0.85;
    p.px(x, y, k < 0.5 ? C[7] : C[6]);
    p.px(x + 1, y, C[5]);
    if (k < 0.75) p.px(x, y + 1, C[4]), p.px(x + 1, y + 1, C[3]);
  }
  // 5) due lucciole viola che restano un attimo e si spengono a scatti
  for (let i = 0; i < 2; i++) {
    const a = g.range(0, TAU), d = g.range(8, 13), t0 = 0.12 + i * 0.06;
    if (t > t0 && t < t0 + 0.2 && Math.floor((t - t0) * 30) % 3 !== 2) p.px(Math.cos(a) * d, Math.sin(a) * d - (t - t0) * 12, clamp(t - t0, 0, 0.1) < 0.1 ? C[6] : C[5]);
  }
}
