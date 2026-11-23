/*
 * Effetto CRT: una seconda tela WebGL sopra quella del gioco, alla risoluzione vera dello schermo. Dopo ogni disegno di
 * Phaser copia l'immagine del gioco e la ridisegna con uno shader: curvatura, sfasamento di rosso e blu, sfocatura,
 * bloom delle luci forti, righe scure, bordi in ombra e grana. L'HUD (HTML) resta sopra, nitido e dritto.
 * Spento, la tela è nascosta e non si copia niente: il gioco costa come prima.
 * Numeri in src/data/crt.ts; acceso o spento si ricorda sul dispositivo (chiave dl-crt).
 */
import Phaser from 'phaser';
import { CRT } from '../data/crt';
import { leggi, scrivi } from './mobile';

const CHIAVE = 'dl-crt';
let acceso = (leggi(CHIAVE) ?? String(CRT.accesoDiSerie)) === '1';

const VERTICI = `
attribute vec2 p;
varying vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAMMENTI = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
uniform sampler2D tex;
uniform vec2 sorgente;   // misura del gioco, in pixel di gioco
uniform float scala;     // pixel dello schermo per pixel di gioco
uniform float tempo;
uniform float curvatura, convergenza, sfocatura, grana;
uniform vec3 bloom;      // forza, soglia, raggio
uniform vec2 righe;      // scuro, spessore
uniform vec2 bordi;      // scuro, inizio

// il pixel di gioco più vicino, netto (la texture è lineare: si prende il suo centro)
vec3 netto(vec2 q) { return texture2D(tex, (floor(q * sorgente) + 0.5) / sorgente).rgb; }
vec3 colore(vec2 q) { return mix(netto(q), texture2D(tex, q).rgb, sfocatura); }

void main() {
  vec2 c = uv * 2.0 - 1.0;
  c *= 1.0 + curvatura * (c.yx * c.yx);
  vec2 q = c * 0.5 + 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 o = vec2(convergenza / sorgente.x, 0.0);
  vec3 col = vec3(colore(q + o).r, colore(q).g, colore(q - o).b);
  if (bloom.x > 0.0) {
    vec3 b = vec3(0.0);
    vec2 r = bloom.z / sorgente;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398;
      vec3 s = texture2D(tex, q + vec2(cos(a), sin(a)) * r).rgb + texture2D(tex, q + vec2(cos(a + 0.39), sin(a + 0.39)) * r * 0.5).rgb;
      b += max(s - 2.0 * bloom.y, 0.0);
    }
    col += b * (bloom.x / 8.0);
  }
  // righe scure tra una riga di pixel di gioco e l'altra, con mezzo pixel dello schermo di bordo morbido
  float y = (1.0 - q.y) * sorgente.y, d = min(fract(y), 1.0 - fract(y)), m = 0.5 / scala;
  col *= 1.0 - righe.x * (1.0 - smoothstep(righe.y * 0.5 - m, righe.y * 0.5 + m, d));
  float v = length(c) / 1.4142;
  col *= 1.0 - bordi.x * smoothstep(bordi.y, 1.0, v);
  col += (fract(sin(dot(gl_FragCoord.xy + tempo, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * grana;
  gl_FragColor = vec4(col, 1.0);
}`;

let tela: HTMLCanvasElement | null = null;
let gioco: HTMLCanvasElement | null = null;
let gl: WebGLRenderingContext | null = null;
let prog: WebGLProgram | null = null;
const u: Record<string, WebGLUniformLocation | null> = {};
let fotogramma = 0;

export function crtAcceso(): boolean {
  return acceso;
}

export function impostaCrt(on: boolean): void {
  acceso = on;
  scrivi(CHIAVE, on ? '1' : '0');
  disegnaCrt();
}

function compila(g: WebGLRenderingContext, tipo: number, testo: string): WebGLShader {
  const s = g.createShader(tipo)!;
  g.shaderSource(s, testo);
  g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(`CRT: ${g.getShaderInfoLog(s)}`);
  return s;
}

function prepara(g: WebGLRenderingContext): void {
  prog = g.createProgram()!;
  g.attachShader(prog, compila(g, g.VERTEX_SHADER, VERTICI));
  g.attachShader(prog, compila(g, g.FRAGMENT_SHADER, FRAMMENTI));
  g.linkProgram(prog);
  g.useProgram(prog);
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const p = g.getAttribLocation(prog, 'p');
  g.enableVertexAttribArray(p);
  g.vertexAttribPointer(p, 2, g.FLOAT, false, 0, 0);
  g.bindTexture(g.TEXTURE_2D, g.createTexture());
  g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
  for (const k of [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T]) g.texParameteri(g.TEXTURE_2D, k, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  for (const k of ['sorgente', 'scala', 'tempo', 'curvatura', 'convergenza', 'sfocatura', 'grana', 'bloom', 'righe', 'bordi']) u[k] = g.getUniformLocation(prog, k);
}

/** Da chiamare una volta, quando Phaser ha creato la tela dentro #gioco. */
export function avviaCrt(phaser: Phaser.Game, contenitore: HTMLElement): void {
  gioco = contenitore.querySelector('canvas');
  if (!gioco) return;
  tela = document.createElement('canvas');
  tela.className = 'crt';
  contenitore.append(tela);
  gl = tela.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
  if (!gl) {
    tela.remove();
    tela = null;
    return;
  }
  try {
    prepara(gl);
  } catch (e) {
    console.warn(e);
    tela.remove();
    tela = null;
    return;
  }
  new ResizeObserver(() => disegnaCrt()).observe(gioco);
  // subito dopo il disegno di Phaser, nello stesso fotogramma: la sua immagine è ancora lì da copiare
  phaser.events.on(Phaser.Core.Events.POST_RENDER, ridisegna);
  disegnaCrt();
}

/** Rimette misura e visibilità della tela (anche dopo un numero cambiato nel LAB: i numeri si leggono a ogni fotogramma). */
export function disegnaCrt(): void {
  if (!tela || !gioco) return;
  tela.hidden = !acceso;
  if (!acceso) return;
  const dpr = window.devicePixelRatio || 1, r = gioco.getBoundingClientRect();
  tela.style.width = `${r.width}px`;
  tela.style.height = `${r.height}px`;
  const l = Math.round(r.width * dpr), a = Math.round(r.height * dpr);
  if (tela.width !== l || tela.height !== a) {
    tela.width = l;
    tela.height = a;
  }
}

function ridisegna(): void {
  if (!acceso || !gl || !gioco || !tela || !tela.width) return;
  const g = gl;
  g.texImage2D(g.TEXTURE_2D, 0, g.RGB, g.RGB, g.UNSIGNED_BYTE, gioco);
  g.viewport(0, 0, tela.width, tela.height);
  g.uniform2f(u.sorgente, gioco.width, gioco.height);
  g.uniform1f(u.scala, Math.max(1, tela.width / gioco.width));
  g.uniform1f(u.tempo, (fotogramma = (fotogramma + 1) % 61));
  g.uniform1f(u.curvatura, CRT.curvatura);
  g.uniform1f(u.convergenza, CRT.convergenza);
  g.uniform1f(u.sfocatura, CRT.sfocatura);
  g.uniform1f(u.grana, CRT.grana);
  g.uniform3f(u.bloom, CRT.bloom.forza, CRT.bloom.soglia, CRT.bloom.raggio);
  g.uniform2f(u.righe, CRT.righe.scuro, CRT.righe.spessore);
  g.uniform2f(u.bordi, CRT.bordi.scuro, CRT.bordi.inizio);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
}
