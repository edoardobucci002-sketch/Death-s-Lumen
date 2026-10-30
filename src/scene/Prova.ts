/*
 * Tappa M0: schermata di prova. Mostra uno sprite esportato da Aseprite, in pixel perfect,
 * con un pulsante per ogni animazione. Verrà sostituita dalla scena di gioco alla tappa M1.
 */
import Phaser from 'phaser';
import type { ElencoAsset } from '../sistema/asset';
import { PERSONAGGI } from '../data/personaggi';
import { vibra } from '../sistema/mobile';

const ETICHETTE: Record<string, string> = {
  idle: 'Fermo', walk: 'Cammina', attack: 'Colpo', special: 'Speciale', hurt: 'Ferito', death: 'Morte',
};

export class Prova extends Phaser.Scene {
  private sprite!: Phaser.GameObjects.Sprite;
  private terreno!: Phaser.GameObjects.Graphics;
  private interfaccia!: HTMLElement;

  constructor() {
    super('Prova');
  }

  create(): void {
    const elenco = this.cache.json.get('elenco') as ElencoAsset;
    const voce = elenco.asset.find((a) => a.categoria === 'personaggi') ?? elenco.asset[0];
    const pg = PERSONAGGI.find((p) => p.sprite === voce.chiave) ?? PERSONAGGI[0];
    document.documentElement.style.setProperty('--accento', pg.colore);

    this.terreno = this.add.graphics();
    this.sprite = this.add.sprite(0, 0, voce.chiave).setOrigin(0.5, 1);
    this.sprite.play(`${voce.chiave}:${voce.tag[0]}`);

    this.interfaccia = document.getElementById('interfaccia')!;
    this.interfaccia.innerHTML = `
      <header class="prova-testa">
        <h1>Death's Lumen</h1>
        <p>${pg.nome} · ${pg.motto}</p>
      </header>
      <footer class="prova-piede">
        <div class="prova-tag">${voce.tag
          .map((t, i) => `<button type="button" data-tag="${t}" aria-pressed="${i === 0}">${ETICHETTE[t] ?? t}</button>`)
          .join('')}</div>
        <p class="prova-info" id="info"></p>
      </footer>`;
    this.interfaccia.querySelectorAll<HTMLButtonElement>('[data-tag]').forEach((b) => {
      b.addEventListener('click', () => {
        this.sprite.play(`${voce.chiave}:${b.dataset.tag}`);
        this.interfaccia.querySelectorAll('[data-tag]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        vibra('leggera');
      });
    });

    const aggiorna = () => {
      this.disponi();
      const info = document.getElementById('info');
      if (info) info.textContent = `${voce.chiave}_V${voce.versioneFile} · ${this.scale.width}×${this.scale.height} px · ×${this.registry.get('scala')}`;
    };
    this.scale.on('resize', aggiorna);
    aggiorna();
  }

  /** Centra lo sprite e ridisegna il terreno: tombe e croci in pixel, deterministiche. */
  private disponi(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.sprite.setPosition(Math.round(w / 2), Math.round(h * 0.62));
    const g = this.terreno.clear();
    g.fillStyle(0x17130f).fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 24) {
      for (let x = 0; x < w; x += 24) {
        const r = pseudo(x, y);
        if (r < 0.04) {
          g.fillStyle(0x3d3832).fillRect(x, y - 10, 10, 14).fillRect(x + 1, y - 12, 8, 2);
          g.fillStyle(0x0e0b09).fillRect(x - 1, y + 4, 12, 2);
        } else if (r < 0.06) {
          g.fillStyle(0x37322b).fillRect(x + 4, y - 12, 3, 16).fillRect(x, y - 8, 11, 3);
        } else if (r < 0.3) {
          g.fillStyle(0x26251a).fillRect(x + 6, y, 1, 3).fillRect(x + 4, y + 1, 1, 2).fillRect(x + 8, y - 1, 1, 4);
        }
      }
    }
    // alone della lanterna, a retino
    const cx = this.sprite.x;
    const cy = this.sprite.y - 18;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - cx, y - cy) / 110;
        if (d > 1 && BAYER[y & 3][x & 3] < Math.min(0.75, (d - 1) * 0.9)) g.fillStyle(0x080605).fillRect(x, y, 1, 1);
      }
    }
  }
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => v / 16));

function pseudo(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
