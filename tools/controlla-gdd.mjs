// Controllo del GDD: confronta le tabelle e i numeri di docs/GDD.md con src/data/.
//
// Come funziona: trascrive i file di src/data/ in una cartella temporanea (con il
// compilatore TypeScript già installato), li carica e li confronta con quello che c'è
// scritto nelle tabelle del GDD. I numeri «attesi» sono scritti qui sotto, nello
// stesso modo in cui compaiono nel GDD: se cambi un numero nel codice e lo aggiorni nel
// GDD, aggiorna anche il valore atteso qui (o lo script segnala una differenza).
// Il testo discorsivo del GDD non si controlla con lo script: si controlla a lettura.
//
// Esce con codice 1 se trova differenze: in quel caso la tappa non è finita.
// Uso: npm run controlla-gdd

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- Trascrive src/data/*.ts in JS, in una cartella temporanea -----------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'controlla-gdd-'));
for (const f of fs.readdirSync(path.join(radice, 'src/data')).filter((x) => x.endsWith('.ts'))) {
  const testo = fs.readFileSync(path.join(radice, 'src/data', f), 'utf8');
  const js = ts.transpileModule(testo, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  fs.writeFileSync(path.join(tmp, f.replace(/\.ts$/, '.js')), js);
}
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"commonjs"}');
const richiedi = createRequire(path.join(tmp, 'x.js'));
const D = (nome) => richiedi('./' + nome + '.js');

const A = D('armi'), N = D('nemici'), AB = D('abilita'), P = D('personaggi'), DO = D('doni'), M = D('meta'), R = D('rosario'), U = D('unioni'), ST = D('stati'), PR = D('progressione'), SO = D('sopravvivenza'), OG = D('oggetti'), W = D('mondo');
const gdd = fs.readFileSync(path.join(radice, 'docs/GDD.md'), 'utf8');
const diff = [];
let controlli = 0;

// --- Parte 1: armi, nemici, personaggi, abilità, doni, ceri, drop, carte, stati, unioni ---
const num=(t)=>{ t=t.trim().replace(/\*/g,'').replace(',','.').replace('−','-'); const m=t.match(/^-?[\d.]+/); return m?parseFloat(m[0]):NaN; };
const bool=(t)=>t.trim()==='sì'?true:t.trim()==='no'?false:null;
function sezione(titolo){ const i=gdd.indexOf(titolo); if(i<0){diff.push('manca sezione '+titolo);return [];} const rest=gdd.slice(i+titolo.length); const righe=[]; for(const l of rest.split('\n')){ if(/^#{1,4} /.test(l)&&righe.length) break; if(/^\| \d/.test(l)) righe.push(l.split('|').slice(1,-1).map(c=>c.trim())); } return righe; }
function conf(nome,arma,titolo,cols){ // cols: chiavi per colonna dopo il livello; null = salta; 'testo'
  const righe=sezione(titolo); if(righe.length!==8) diff.push(`${nome}: righe trovate ${righe.length}`);
  righe.forEach((r,i)=>{ const L=arma.livelli[i]; if(!L){diff.push(`${nome} lv${i+1}: manca nel codice`);return;}
    cols.forEach((k,c)=>{ if(!k) return; const g=r[c+1]; controlli++;
      if(k==='testo'){ if(g!==L.testo) diff.push(`${nome} lv${i+1} testo: GDD «${g}» ≠ codice «${L.testo}»`); }
      else if(typeof L[k]==='boolean'){ if(bool(g)!==L[k]) diff.push(`${nome} lv${i+1} ${k}: GDD ${g} ≠ codice ${L[k]}`); }
      else { const v=num(g); if(Math.abs(v-L[k])>0.0051) diff.push(`${nome} lv${i+1} ${k}: GDD ${g} ≠ codice ${L[k]}`); } }); });
}
conf('Lanterna',A.LANTERNA,'#### Lanterna',['ricarica','danno','raggio','ampiezza','spalle','testo']);
conf('Pala',A.PALA,'#### Pala',['ricarica','danno','raggio',null,'doppio','testo']);
conf('Turibolo',A.TURIBOLO,'#### Turibolo',['ricarica','quantita','danno','raggio','durata','testo']);
conf('Bastone',A.BASTONE,'#### Bastone',['ricarica','quantita','danno','trapassa',null,'testo']);
conf('Candela',A.CANDELA,'#### Candela',['ricarica','danno','quantita','trapassa',null,'testo']);
conf('Falce',A.FALCE,'#### Falce',['quantita','danno','raggio','giri','testo']);
conf('Campana',A.CAMPANA,'#### Campana',['ricarica','danno','raggio','doppio','testo']);
conf('Fuoco fatuo',A.FUOCO_FATUO,'#### Fuoco fatuo',['ricarica','quantita','danno','trapassa','testo']);
conf('Acqua santa',A.ACQUA_SANTA,'#### Acqua santa',['ricarica','quantita','danno','raggio','durata','testo']);
conf('Lama di luce',A.LAMA_DI_LUCE,'#### Lama di luce',['ricarica','danno','lunghezza','spalle','testo']);
// costanti d'arma citate nel testo
const k=(nome,g,c)=>{controlli++; if(Math.abs(g-c)>0.0051) diff.push(`${nome}: GDD ${g} ≠ codice ${c}`);};
k('Lanterna respinta',259,A.LANTERNA.respinta); k('Pala respinta',423,A.PALA.respinta); k('Pala distanza',61,A.PALA.distanza); k('Pala ritardo doppio',0.22,A.PALA.ritardoDoppio);
k('Turibolo distanza prima',47,A.TURIBOLO.distanzaPrima); k('Turibolo distanza altre',94,A.TURIBOLO.distanzaAltre); k('Turibolo intervallo',0.3,A.TURIBOLO.intervallo); k('Turibolo rallenta',0.3,A.TURIBOLO.rallenta);
k('Bastone portata',611,A.BASTONE.portata); k('Bastone velocità',541,A.BASTONE.velocita); k('Bastone raggio',9,A.BASTONE.raggio); k('Bastone intervallo',0.08,A.BASTONE.intervallo); k('Bastone vita',1.3,A.BASTONE.vita);
k('Candela portata',700,A.CANDELA.portata); k('Candela velocità',705,A.CANDELA.velocita); k('Candela vita',1.4,A.CANDELA.vita); k('Candela raggio',9,A.CANDELA.raggio);
k('Falce pausa',0.45,A.FALCE.pausa); k('Falce respinta',165,A.FALCE.respinta); k('Falce raggio lama',24,A.FALCE.raggioLama);
k('Campana respinta',470,A.CAMPANA.respinta); k('Campana ritardo',0.35,A.CAMPANA.ritardoDoppio);
k('Fuoco fatuo portata',752,A.FUOCO_FATUO.portata); k('Fuoco fatuo velocità',470,A.FUOCO_FATUO.velocita); k('Fuoco fatuo vita',3.2,A.FUOCO_FATUO.vita); k('Fuoco fatuo sterzo',6,A.FUOCO_FATUO.sterzo);
k('Lama altezza',103,A.LAMA_DI_LUCE.altezza); k('Lama ritardo spalle',0.12,A.LAMA_DI_LUCE.ritardoSpalle); k('Lama respinta',259,A.LAMA_DI_LUCE.respinta);
k('Acqua santa intervallo',0.3,A.ACQUA_SANTA.intervallo);
k('Armi massime',6,A.MAX_ARMI);
// armi nuove (prosa)
const nuove=[['Lapide',A.LAPIDE,'| Lapide |','120 danni, ogni 3,2 s, raggio 84','260 danni, 2 lapidi, ogni 2,4 s, raggio 110'],
 ['Rosario spezzato',A.ROSARIO_SPEZZATO,'| Rosario spezzato |','18 danni, 4 rimbalzi, ogni 1,6 s','40 danni, 8 rimbalzi, 2 grani, ogni 1,2 s'],
 ['Corvo',A.CORVO,'| Corvo |','26 danni, 1 corvo, ogni 1 s, 1 anima','44 danni, 3 corvi, ogni 0,75 s, 4 anime'],
 ['Velo funebre',A.VELO_FUNEBRE,'| Velo funebre |','7 danni, raggio 110, ogni 0,5 s','21 danni, raggio 160, ogni 0,4 s']];
for(const [n,a,key,l1,l8] of nuove){ const riga=gdd.split('\n').find(l=>l.startsWith(key)); if(!riga){diff.push('manca riga arma nuova '+n);continue;}
  const c=riga.split('|').map(x=>x.trim()); controlli+=2;
  if(c[4]!==l1) diff.push(`${n} livello 1 nel GDD «${c[4]}» ≠ atteso «${l1}»`);
  const e1=a.livelli[0], e8=a.livelli[7];
  const nums=(t)=>(t.match(/[\d]+(?:,\d+)?/g)||[]).map(x=>parseFloat(x.replace(',','.')));
  // la «quantità 1» (un oggetto solo) il GDD può scriverla o sottintenderla: valgono tutte e due le forme
  const set=(L,con1)=>[L.danno,L.ricarica,L.raggio,L.rimbalzi,(L.quantita===1&&!con1)?undefined:L.quantita,L.anime].filter(x=>x!==undefined).sort((a,b)=>a-b).join();
  const gs1=nums(c[4]).sort((a,b)=>a-b).join(), gs8=nums(c[5]).sort((a,b)=>a-b).join();
  if(gs1!==set(e1,false)&&gs1!==set(e1,true)) diff.push(`${n} liv.1: numeri GDD [${gs1}] ≠ codice [${set(e1,false)}]`);
  if(gs8!==set(e8,false)&&gs8!==set(e8,true)) diff.push(`${n} liv.8: numeri GDD [${gs8}] ≠ codice [${set(e8,false)}]`); }
// nemici
const mapN={'Pipistrello':'pipistrello','Zombi':'zombi','Fantasma':'fantasma','Scheletro':'scheletro','Segugio':'segugio','Bruto':'bruto'};
for(const l of gdd.split('\n')){ const c=l.split('|').map(x=>x.trim()); const id=mapN[c[1]]||(c[1]&&c[1].startsWith('Seth')?'mietitore':null); if(!id||c.length<9) continue;
  const T=N.NEMICI.find(t=>t.id===id); [['salute',2],['velocita',3],['danno',4],['raggio',5],['anime',6]].forEach(([key,i])=>{controlli++; if(num(c[i])!==T[key]) diff.push(`Nemico ${id} ${key}: GDD ${c[i]} ≠ codice ${T[key]}`);}); }
// difficoltà e costanti
const D2=N.DIFFICOLTA; k('salute/min',0.28,D2.salutePerMinuto); k('salute accelera',0.06,D2.saluteAccelera); k('salute dopo min',3,D2.saluteDopo); k('danno/min',0.16,D2.dannoPerMinuto); k('tetto',380,D2.tetto); k('massimi base',20,D2.massimiBase); k('massimi/min',30,D2.massimiPerMinuto); k('comparse base',1.2,D2.comparseBase); k('comparse/min',2.5,D2.comparsePerMinuto); k('per fotogramma',8,D2.comparsePerFotogramma);
const E=N.ELITE; k('élite salute',7,E.salute); k('élite danno',1.4,E.danno); k('élite anime',6,E.anime); k('élite dimensione',1.5,E.dimensione); k('élite vel',0.9,E.velocita); k('élite ogni',55,E.ogni);
const O=N.ORDE; k('orde primo',150,O.primo); k('orde ogni',80,O.ogni); k('orde base',12,O.base); k('orde/min',2,O.perMinuto); k('orde max',28,O.massimo); k('orde per fila',7,O.perFila); k('orde spazio',2.4,O.spazio); k('orde marcia',80,O.marcia); k('orde carica dist',260,O.distanzaCarica); k('orde carica',1.35,O.carica); k('orde tenaglia',420,O.tenagliaDal);
const S=N.SCIAMI; k('sciami base',14,S.base); k('sciami/min',3,S.perMinuto); k('sciami max',56,S.massimo); k('sciami vel',1.12,S.velocita);
const MI=N.MIETITORE; k('Seth salute×',3.5,MI.saluteSecondo); k('Seth riprende',0.45,MI.riprende); k('scatto carica',0.7,MI.carica); k('scatto durata',0.55,MI.scatto); k('scatto vel',3.6,MI.velocitaScatto);
k('falciata carica',0.95,MI.falciata.carica); k('falciata raggio',200,MI.falciata.raggio); k('falciata danno',22,MI.falciata.danno);
k('falci carica',0.6,MI.falci.carica); k('falci quante',5,MI.falci.quante); k('falci ventaglio',0.9,MI.falci.ventaglio); k('falci vel',330,MI.falci.velocita); k('falci raggio',18,MI.falci.raggio); k('falci danno',16,MI.falci.danno); k('falci durata',3.2,MI.falci.durata);
k('chiamata carica',1.1,MI.chiamata.carica); k('chiamata quanti',8,MI.chiamata.quanti); k('chiamata dist',190,MI.chiamata.distanza);
k('pesi mosse scatto',3,MI.mosse.scatto); k('pesi falciata',3,MI.mosse.falciata); k('pesi falci',2,MI.mosse.falci); k('pesi chiamata',1.5,MI.mosse.chiamata); k('Seth reliquiari',2,MI.reliquiari);
const IA=N.IA; k('accerchia stringe',0.6,IA.accerchia.stringe); k('accerchia vicino',120,IA.accerchia.vicino); k('intercetta',1.1,IA.intercetta.anticipo); k('zigzag amp',0.7,IA.zigzag.ampiezza); k('zigzag freq',5,IA.zigzag.frequenza);
// personaggi
const PG=P.PERSONAGGI; const pg=(id)=>PG.find(p=>p.id===id);
k('base salute',100,P.BASE.salute); k('base velocità',245,P.BASE.velocita); k('base raccolta',150,P.BASE.raccolta);
const barre={lampionaio:[3,3,4,3,4],becchino:[5,5,2,2,3],badessa:[4,2,3,5,3],strega:[2,4,3,4,5]};
for(const id in barre){controlli++; if(barre[id].join()!==pg(id).barre.join()) diff.push(`Barre ${id}: GDD ${barre[id]} ≠ codice ${pg(id).barre}`);}
const mod={lampionaio:{velocita:0.1,rigenerazione:0.2},becchino:{salute:30,armatura:0.1,danno:0.05,velocita:-0.03},badessa:{salute:10,rigenerazione:0.3,area:0.15},strega:{salute:-5,danno:0.1,ricarica:0.1}};
for(const id in mod) for(const key of ['salute','velocita','danno','ricarica','area','armatura','rigenerazione']){controlli++; if((mod[id][key]||0)!==pg(id)[key]) diff.push(`Personaggio ${id} ${key}: GDD ${mod[id][key]||0} ≠ codice ${pg(id)[key]}`);}
// abilità
for(const l of gdd.split('\n')){ const c=l.split('|').map(x=>x.trim()); const a=Object.values(AB.ABILITA).find(x=>x.nome===c[1]); if(!a||c.length<8) continue;
  [['ricarica',2],['durata',3],['raggio',4]].forEach(([key,i])=>{controlli++; if(num(c[i])!==a[key]) diff.push(`Abilità ${a.id} ${key}: GDD ${c[i]} ≠ codice ${a[key]}`);});
  const m=c[5].match(/^(\d+) ogni ([\d,]+) s/); controlli+=2; if(!m||+m[1]!==a.danno||num(m[2])!==a.intervallo) diff.push(`Abilità ${a.id} danno/intervallo: GDD ${c[5]} ≠ codice ${a.danno} ogni ${a.intervallo}`); }
// doni
// solo la tabella dei doni (3 colonne): la Calamita compare anche nei drop
for(const l of gdd.split('\n')){ const c=l.split('|').map(x=>x.trim()); const d=DO.PASSIVI.find(x=>x.nome===c[1]); if(!d||c.length!==5) continue; controlli++; if(num(c[3])!==d.massimo) diff.push(`Dono ${d.id} massimo: GDD ${c[3]} ≠ codice ${d.massimo}`); }
const dnum={cuoreDiCera:'+20',saleNero:'+10%',clessidra:'−7%',stoppinoLungo:'+10%',aliDiFalena:'+8%',calamita:'+30%',erbeAmare:'+0,25',scudoDiFerro:'−6%',ceraVotiva:'+15%',chiodoDiBara:'+6%',lacrimaDiLumen:'+1',campanellaDArgento:'+0,1'};
for(const d of DO.PASSIVI){ const riga=gdd.split('\n').find(l=>l.startsWith('| '+d.nome+' |')); controlli++; if(!riga) {diff.push('Dono mancante nel GDD: '+d.nome); continue;} if(!riga.includes(dnum[d.id]??'+1')) diff.push(`Dono ${d.id}: la riga del GDD non contiene ${dnum[d.id]}`); }
k('doni massimi',6,DO.MAX_PASSIVI); k('clessidra minimo',0.4,DO.RICARICA_MINIMA);
// ceri
const costi=M.COSTI_CERO.join(); controlli++; if(costi!=='30,60,100,150,220') diff.push('Costi ceri codice '+costi);
k('Seconda candela costo',400,M.SECONDA_CANDELA.costo); k('Seconda candela salute',0.3,M.SECONDA_CANDELA.salute); k('Seconda candela invulnerabilità',2,M.SECONDA_CANDELA.invulnerabilita); k('Cera alba',100,M.CERA.alba);
const sb={becchino:[5,200],badessa:[0,400],strega:[0,700]}; for(const id in sb){controlli++; if(M.SBLOCCHI[id].cera!==sb[id][1]) diff.push(`Sblocco ${id} Cera ${M.SBLOCCHI[id].cera} ≠ GDD ${sb[id][1]}`);}
k('Rosario sblocco minuti',8,M.SBLOCCO_ROSARIO.minuti); k('Rosario sblocco Cera',300,M.SBLOCCO_ROSARIO.cera); k('Unioni sblocco minuti',10,M.SBLOCCO_UNIONI.minuti); k('Unioni sblocco Cera',500,M.SBLOCCO_UNIONI.cera);
const so={lapide:null,rosarioSpezzato:10,corvo:30000,veloFunebre:180,campanellaDArgento:20}; for(const s of M.SBLOCCHI_OGGETTI){ if(s.id in so&&so[s.id]!==null){controlli++; if(s.soglia!==so[s.id]) diff.push(`Sblocco ${s.id} soglia ${s.soglia} ≠ ${so[s.id]}`);} }
const cera={chiodoDiBara:120,lacrimaDiLumen:120,campanellaDArgento:120}; for(const id in cera){controlli++; const s=M.SBLOCCHI_OGGETTI.find(x=>x.id===id); if(s.cera!==cera[id]) diff.push(`Sblocco ${id} Cera ${s.cera} ≠ ${cera[id]}`);}
// drop
k('pane prob',0.009,OG.DROP.pane.probabilita); k('pane ogni',45,OG.DROP.pane.ogni); k('pane cura',40,OG.DROP.pane.cura); k('calamita prob',0.0025,OG.DROP.calamita.probabilita); k('calamita ogni',180,OG.DROP.calamita.ogni); k('cera prob',0.004,OG.DROP.cera.probabilita); k('cera élite',3,OG.DROP.cera.perElite); k('cera Seth',10,OG.DROP.cera.perSeth); k('reliquiario tre',0.25,OG.DROP.reliquiario.tre); k('presa',40,OG.DROP.presa); k('alba',900,OG.ALBA);
// esperienza e carte
const pl=PR.animePerLivello; [[1,6],[5,42],[10,132],[20,462],[40,1722],[60,3782]].forEach(([l,v])=>k('anime livello '+l,v,pl(l)));
const C=PR.CARTE; k('carte quante',3,C.quante); k('rimescolate',2,C.rimescolate); k('arma iniziale',2,C.armaIniziale); k('arma posseduta',1.5,C.armaPosseduta); k('arma nuova',1,C.armaNuova); k('dono posseduto',1.2,C.donoPosseduto); k('dono nuovo',0.9,C.donoNuovo); k('pane e vino',40,C.paneEVino); k('pool armi',6,C.pool.armi); k('pool doni',9,C.pool.doni);
k('anime a terra max',320,PR.ANIME.massimeATerra); k('anime media',6,PR.ANIME.media); k('anime grande',20,PR.ANIME.grande); k('anime volo',420,PR.ANIME.volo); k('anime accel',900,PR.ANIME.accelerazione); k('anime presa',24,PR.ANIME.presa);
// combattimento
const CB=N.COMBATTIMENTO; k('raggio giocatore',21,CB.raggioGiocatore); k('invulnerabilità',0.45,CB.invulnerabilita); k('salute bassa',0.35,CB.saluteBassa); k('attesa fine',0.9,CB.attesaFine);
k('armatura massima',0.6,P.BASE.armaturaMassima); k('casoMin',0.92,A.COLPI.casoMinimo); k('casoMax',1.08,A.COLPI.casoMassimo); k('attrito',8,A.COLPI.attrito); k('respinta pesanti',0.25,A.COLPI.respintaPesanti); k('lampo nemico',0.1,A.COLPI.lampoNemico); k('corpo',36,A.COLPI.corpo);
// fiaschetta e grazia
k('sorsi',3,SO.FIASCHETTA.sorsi); k('cura sorso',0.35,SO.FIASCHETTA.cura); k('durata sorso',1,SO.FIASCHETTA.durata); k('distanza fiaschetta',12,SO.FIASCHETTA.distanza); k('Grazia finestra',0.25,SO.GRAZIA.finestra); k('Grazia sfioro',30,SO.GRAZIA.sfioro); k('Grazia durata',3,SO.GRAZIA.durata); k('Grazia danno',0.3,SO.GRAZIA.danno); k('Grazia velocità',0.15,SO.GRAZIA.velocita); k('Grazia lampi',10,SO.GRAZIA.lampi);
// stati e reazioni
const S2=ST.STATI; k('stato durata',3,S2.durata); k('stato prob',0.1,S2.probabilita); k('stato prob zone',0.05,S2.probabilitaZone); k('abbagliato',0.15,S2.abbagliato.danno); k('consacrato',0.25,S2.consacrato.lento); k('maledetto',0.02,S2.maledetto.perSecondo); k('sepolto fermo',0.6,S2.sepolto.fermo); k('sepolto pausa',4,S2.sepolto.pausa); k('simboli max',200,S2.simboli.massimi); k('Seth fermo',0.5,S2.mietitore.fermo); k('Seth maledetto',0.1,S2.mietitore.maledetto); k('élite maledetto',0.4,S2.elite.maledetto);
const RZ=ST.REAZIONI; k('eclissi raggio',64,RZ.eclissi.raggio); k('eclissi parte',0.1,RZ.eclissi.parte); k('eclissi tetto',80,RZ.eclissi.tetto); k('rivelazione anime',2,RZ.rivelazione.anime); k('esorcismo fiammelle',3,RZ.esorcismo.fiammelle); k('esorcismo danno',18,RZ.esorcismo.danno); k('interramento fermo',1.5,RZ.interramento.fermo); k('interramento danno',0.3,RZ.interramento.danno);
const RU=ST.RUOLI; k('esplosione raggio',40,RU.esplosioneBastone.raggio); k('esplosione danno',0.35,RU.esplosioneBastone.danno); k('preda',0.25,RU.fuocoFatuoPreda); k('falce cresce',0.02,RU.falceCrescita.perUccisione); k('falce max',0.3,RU.falceCrescita.massimo); k('falce durata',5,RU.falceCrescita.durata); k('campana fermo',0.6,RU.campanaFermo); k('rosario maledice',0.35,RU.rosarioMaledice); k('velo consacra',0.2,RU.veloConsacra);
// rosario e amuleti
k('grani',3,R.ROSARIO.grani); k('grani per Seth',1,R.ROSARIO.perSeth); k('grani max',5,R.ROSARIO.massimo); k('peccato',1,R.ROSARIO.peccato); k('proposte',3,R.ROSARIO.proposte);
const am={specchioRotto:[3,'+25%'],lanternaCieca:[2,'+35%'],cuoreAvido:[2,'+30%'],sangueFreddo:[1,'+40%'],martire:[3,'−20%'],danzaMacabra:[2,'2 s'],ceriGemelli:[2,'+30%'],lucciola:[1,'+20%'],ossaDelite:[1,'+40%'],pattoDiSangue:[2,'0,2']};
for(const a of R.AMULETI){ const riga=gdd.split('\n').find(l=>l.startsWith('| '+a.nome+' |')); controlli++; if(!riga){diff.push('Amuleto mancante nel GDD: '+a.nome);continue;} const c=riga.split('|').map(x=>x.trim()); if(+c[2]!==a.grani) diff.push(`Amuleto ${a.id} grani: GDD ${c[2]} ≠ codice ${a.grani}`); if(!riga.includes(am[a.id][1])) diff.push(`Amuleto ${a.id}: la riga non contiene ${am[a.id][1]}`); }
const AN=R.AMULETI_NUMERI; k('Specchio rotto danno subito',0.25,AN.specchioRotto.dannoSubito); k('Lanterna cieca danno',0.35,AN.lanternaCieca.danno); k('Lanterna cieca alone',0.15,AN.lanternaCieca.alone); k('Cuore avido anime',0.3,AN.cuoreAvido.anime); k('Cuore avido cura',0.5,AN.cuoreAvido.cura); k('Sangue freddo sotto',0.3,AN.sangueFreddo.sotto); k('Sangue freddo danno',0.4,AN.sangueFreddo.danno); k('Martire raggio',150,AN.martire.raggio); k('Martire danno',30,AN.martire.danno); k('Martire salute',-0.2,AN.martire.salute); k('Danza sfiora',16,AN.danzaMacabra.sfiora); k('Danza durata Grazia',2,AN.danzaMacabra.durataGrazia); k('Danza recupero (GDD «una ogni 3 s»)',3,AN.danzaMacabra.recupero); k('Ceri gemelli cariche',2,AN.ceriGemelli.cariche); k('Ceri gemelli ricarica',0.3,AN.ceriGemelli.ricarica); k('Lucciola alone',0.2,AN.lucciola.alone); k('Lucciola intervallo',0.5,AN.lucciola.intervallo); k('Ossa reliquiari',2,AN.ossaDelite.reliquiari); k('Ossa salute',0.4,AN.ossaDelite.salute); k('Patto cura',0.2,AN.pattoDiSangue.cura);
// unioni
const nomiArma={lanterna:'Lanterna',pala:'Pala',turibolo:'Turibolo',bastone:'Bastone',candela:'Candela',falce:'Falce',campana:'Campana',fuocoFatuo:'Fuoco fatuo',acquaSanta:'Acqua santa',lamaDiLuce:'Lama di luce'};
const nomiDono={}; DO.PASSIVI.forEach(d=>nomiDono[d.id]=d.nome);
for(const u of U.UNIONI){ const attesa=`| ${nomiArma[u.arma]} | ${nomiDono[u.dono]} | ${u.nome} |`; controlli++; if(!gdd.includes(attesa)) diff.push(`Unione ${u.id}: nel GDD manca la riga «${attesa}»`); }
const NU=U.NUMERI_UNIONI; k('faro abbaglia',0.5,NU.faro.abbaglia); k('vanga fermo',3,NU.vanga.fermo); k('incensiere cura',1,NU.incensiere.cura); k('verga ogni',5,NU.verga.ogni); k('candelabro ogni',0.12,NU.candelabro.ogni); k('candelabro danno',0.4,NU.candelabro.danno); k('candelabro raggio',36,NU.candelabro.raggio); k('candelabro durata',1,NU.candelabro.durata); k('candelabro intervallo',0.3,NU.candelabro.intervallo); k('falce sotto',0.15,NU.falce.sotto); k('campana fermo unione',0.8,NU.campana.fermo); k('fuochi raggio',120,NU.fuochi.raggio); k('acquasantiera uccisioni',40,NU.acquasantiera.uccisioni); k('lama ritardo',0.5,NU.lama.ritardo); k('livello dono unione',3,U.LIVELLO_DONO_UNIONE);
// abilità: pronta dopo
k('abilità pronta dopo',4,AB.PRONTA_DOPO);
// --- Parte 2: ceri (dal GDD), mondo, cronologia dei nemici e pesi di comparsa -------------
{
const num2=(t)=>parseFloat(String(t).replace(',','.').replace('−','-').match(/-?[\d.,]+/)[0].replace(',','.'));
const riga=(pref)=>gdd.split('\n').find(l=>l.startsWith(pref));
// ceri: per livello e massimo dal GDD
for(const c of M.CERI){ const r=riga('| '+c.nome+' |'); controlli++; if(!r){diff.push('Cero mancante '+c.nome);continue;} const cc=r.split('|').map(x=>x.trim()); const per=Math.abs(num2(cc[2])), max=Math.abs(num2(cc[3]));
  if(c.id==='scelta'){ if(max!==3) diff.push('Cero scelta massimo '+max); continue;} 
  if(Math.round(c.per*100)!==per) diff.push(`Cero ${c.id}: per livello GDD ${per}% ≠ codice ${c.per*100}%`); if(per*5!==max) diff.push(`Cero ${c.id}: massimo GDD ${max} ≠ 5 livelli × ${per}`); }
const rc=riga('| Cero della scelta'); 
const mCosti=gdd.match(/costo 30, 60, 100, 150, 220 Cera \((\d+) per cero\)/); controlli++; if(!mCosti||+mCosti[1]!==M.COSTI_CERO.reduce((a,b)=>a+b)) diff.push('Costo totale cero GDD '+(mCosti&&mCosti[1])+' ≠ '+M.COSTI_CERO.reduce((a,b)=>a+b));
// mondo §11
const pair=(pref,val,nome)=>{const r=riga(pref); controlli++; if(!r){diff.push('manca riga '+pref);return;} const cc=r.split('|').map(x=>x.trim()); const g=num2(cc[2]); if(Math.abs(g-val)>0.0051) diff.push(`${nome}: GDD ${cc[2]} ≠ codice ${val}`);};
pair('| Raggio della luce',W.LUCE.raggio,'raggio luce'); pair('| Sfumatura del buio',W.LUCE.sfumatura,'sfumatura'); pair('| Centro della luce',W.LUCE.altezza,'centro luce');
const rb=riga('| Buio massimo'); controlli++; if(!rb.includes(String(W.LUCE.buioMassimo*100)+'%')) diff.push('buio massimo');
const rt=riga('| Terreno'); controlli++; if(!(rt.includes('1120')&&rt.includes('56')&&rt.includes('4%')&&rt.includes('2%')&&rt.includes('24%'))) diff.push('terreno');
const rj=riga('| Joystick'); controlli++; if(!(rj.includes('44')&&rj.includes('18%'))) diff.push('joystick');
const rg=riga('| Dove nascono'); controlli++; if(!rg.includes(String(N.COMPARSA.margine))) diff.push('margine comparsa');
const rs=riga('| Separazione'); controlli++; if(!(rs.includes('0,5')&&rs.includes('75%'))) diff.push('separazione');
const rba=riga('| Barra della salute'); controlli++; if(!rba.includes('5 px')) diff.push('barra salute distanza');
const re=riga('| Numeri del danno'); controlli++; if(!(re.includes('0,55')&&re.includes('22')&&re.includes('40'))) diff.push('numeri danno');
const rsc=riga('| Scoppio'); controlli++; if(!rsc.includes('0,2 s')) diff.push('scoppio');
// cronologia e pesi
const cron=[['0:50',50,'fantasma'],['2:20',140,'scheletro'],['3:50',230,'segugio'],['6:00',360,'bruto']];
for(const [t,s,id] of cron){ controlli++; const T=N.NEMICI.find(x=>x.id===id); if(T.peso(s-1)!==0||T.peso(s+1)===0) diff.push(`Comparsa ${id}: non parte a ${t} (${s} s)`); if(!gdd.includes(`| ${t} |`)&&!gdd.includes(`| ${t}, `)) diff.push('cronologia: manca '+t); }
controlli++; if(N.ELITE.primo!==55||!gdd.includes('| 0:55, poi ogni 55 s |')) diff.push('élite 0:55');
controlli++; if(N.ORDE.primo!==150||N.ORDE.ogni!==80||!gdd.includes('| 2:30, poi ogni 80 s fino a 14:20 |')||N.ORDE.ultimo!==860) diff.push('orde cronologia');
controlli++; if(JSON.stringify(N.MIETITORE.minuti)!=='[5,10]') diff.push('Seth minuti');
// pesi di comparsa dal GDD
const T=(id)=>N.NEMICI.find(x=>x.id===id); controlli+=6;
if(T('pipistrello').peso(0)!==3||T('pipistrello').peso(1000)!==0.7) diff.push('peso pipistrello (3 − s/200, min 0,7)');
if(T('zombi').peso(100)!==3||T('zombi').peso(500)!==1.5) diff.push('peso zombi (3, poi 1,5 dall\'8° minuto)');
if(T('fantasma').peso(100)!==2) diff.push('peso fantasma'); if(T('scheletro').peso(200)!==2.6) diff.push('peso scheletro'); if(T('segugio').peso(300)!==2) diff.push('peso segugio');
const b=T('bruto'); if(Math.abs(b.peso(400)-Math.min(1+400/600,(400-360)/75))>1e-9) diff.push('peso bruto');
// salute/danno nemici al minuto 10 e 15
const sal=(m)=>1+0.28*m+(m>3?0.06*(m-3)**2:0); controlli+=2; if(Math.abs(sal(10)-6.74)>0.01||Math.abs(sal(15)-13.84)>0.01) diff.push('salute ×6,7 e ×13,8');
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Controlli fatti: ${controlli}`);
console.log(`Differenze: ${diff.length}`);
diff.forEach((d) => console.log('- ' + d));
if (diff.length) {
  console.log('\nIl GDD e src/data/ non coincidono: la tappa non è finita.');
  process.exit(1);
}
