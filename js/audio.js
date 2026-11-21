/* Procedural audio — sound effects, ambience and a dark drone score, all synthesised with WebAudio */
(function () {
'use strict';
const AU = window.AU = {};
let ctx = null, master, sfx, amb, mus, noiseBuf, musNodes = null, bossLayer = null;
AU.volume = 0.8;
AU.init = function () {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = AU.volume; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
  sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(comp);
  amb = ctx.createGain(); amb.gain.value = 0.35; amb.connect(comp);
  mus = ctx.createGain(); mus.gain.value = 0.28; mus.connect(comp);
  const len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  startAmbience(); // background drone music removed
};
AU.setVolume = function (v) { AU.volume = v; if (master) master.gain.value = v; };
const now = () => ctx.currentTime;
function noise(dur, { f = 1000, q = 1, type = 'bandpass', gain = 0.5, attack = 0.005, f2, out = sfx, delay = 0 } = {}) {
  if (!ctx) return; const t = now() + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
function tone(dur, { f = 220, f2, type = 'sine', gain = 0.3, attack = 0.005, out = sfx, delay = 0 } = {}) {
  if (!ctx) return; const t = now() + delay;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
AU.swing = (heavy) => { noise(heavy ? 0.4 : 0.26, { f: 400, f2: 2600, q: 1.4, gain: heavy ? 0.5 : 0.35, attack: 0.06 }); tone(0.25, { f: 180, f2: 900, type: 'sawtooth', gain: 0.03, attack: 0.05 }); };
AU.hit = (heavy) => { noise(0.18, { f: 2400, q: 2, gain: 0.7 }); tone(0.5, { f: heavy ? 520 : 760, f2: heavy ? 300 : 500, type: 'triangle', gain: 0.18 }); tone(0.3, { f: 1830, type: 'sine', gain: 0.06 }); noise(0.25, { f: 180, type: 'lowpass', gain: heavy ? 0.9 : 0.5 }); };
AU.block = () => { tone(0.6, { f: 1240, f2: 900, type: 'triangle', gain: 0.2 }); noise(0.12, { f: 3200, q: 3, gain: 0.5 }); };
AU.hurt = () => { noise(0.3, { f: 300, type: 'lowpass', gain: 0.8 }); tone(0.3, { f: 120, f2: 60, type: 'sine', gain: 0.4 }); };
AU.roll = () => { noise(0.4, { f: 600, f2: 200, type: 'lowpass', gain: 0.4, attack: 0.08 }); };
AU.step = () => { noise(0.08, { f: 260 + Math.random() * 120, type: 'lowpass', gain: 0.15 }); };
AU.mechStep = (s) => { noise(0.14, { f: 140 / s, type: 'lowpass', gain: 0.35 * s }); tone(0.12, { f: 90 / s, f2: 60 / s, gain: 0.12 * s }); };
AU.gun = (d) => { const g = Math.max(0.15, 1 - d / 30); noise(0.16, { f: 1500, f2: 300, q: 0.7, gain: 0.55 * g }); tone(0.18, { f: 140, f2: 50, gain: 0.35 * g }); noise(0.5, { f: 600, type: 'lowpass', gain: 0.12 * g, delay: 0.05 }); };
AU.plasma = () => { tone(0.35, { f: 900, f2: 120, type: 'sawtooth', gain: 0.12 }); noise(0.2, { f: 2000, q: 4, gain: 0.2 }); };
AU.charge = () => { tone(0.6, { f: 200, f2: 1400, type: 'square', gain: 0.04, attack: 0.3 }); };
AU.enemySwing = (big) => { noise(big ? 0.5 : 0.3, { f: big ? 250 : 500, f2: big ? 1200 : 2200, q: 1, gain: big ? 0.6 : 0.35, attack: 0.08 }); };
AU.slam = () => { noise(1.2, { f: 220, type: 'lowpass', gain: 1.0 }); tone(0.9, { f: 70, f2: 30, gain: 0.7 }); };
AU.explode = (big) => { noise(big ? 2.4 : 1.2, { f: big ? 400 : 700, f2: 60, type: 'lowpass', gain: 1.0, attack: 0.01 }); tone(1.0, { f: 80, f2: 25, gain: 0.6 }); noise(0.5, { f: 3000, q: 1, gain: 0.3 }); };
AU.heal = () => { [0, 0.08, 0.16].forEach((dl, i) => tone(0.9, { f: [523, 659, 784][i], gain: 0.08, delay: dl, attack: 0.03 })); noise(0.5, { f: 4000, q: 2, gain: 0.08, attack: 0.1 }); };
AU.beacon = () => { [262, 392, 523, 659, 784].forEach((f, i) => tone(3.5, { f, gain: 0.07, delay: i * 0.12, attack: 0.4, out: sfx })); noise(2.5, { f: 5000, q: 3, gain: 0.05, attack: 0.8 }); };
AU.death = () => { tone(4, { f: 110, f2: 55, type: 'sawtooth', gain: 0.12, attack: 0.5 }); tone(4, { f: 116, f2: 58, type: 'sawtooth', gain: 0.1, attack: 0.5 }); noise(3, { f: 300, type: 'lowpass', gain: 0.3, attack: 1 }); };
AU.victory = () => { [196, 247, 294, 392, 494, 587].forEach((f, i) => tone(5, { f, gain: 0.06, delay: i * 0.25, attack: 1.0, type: 'triangle' })); };
AU.gate = () => { noise(1.5, { f: 1200, f2: 200, q: 2, gain: 0.3, attack: 0.4 }); tone(1.5, { f: 60, gain: 0.4, attack: 0.3 }); };
AU.ui = () => tone(0.12, { f: 880, gain: 0.05 });
AU.heartbeat = () => { tone(0.16, { f: 58, f2: 42, gain: 0.32, attack: 0.01 }); tone(0.14, { f: 52, f2: 40, gain: 0.22, attack: 0.01, delay: 0.22 }); };
AU.thunder = (delay) => { noise(3.5, { f: 160, f2: 40, type: 'lowpass', gain: 0.7, attack: 0.15, out: amb, delay }); };

function startAmbience() {
  // wind
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6;
  const g = ctx.createGain(); g.gain.value = 0.35; s.connect(f); f.connect(g); g.connect(amb); s.start();
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  // fire crackle bed
  const s2 = ctx.createBufferSource(); s2.buffer = noiseBuf; s2.loop = true; const f2 = ctx.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 2500;
  const g2 = ctx.createGain(); g2.gain.value = 0.05; s2.connect(f2); f2.connect(g2); g2.connect(amb); s2.start();
}
function startMusic() {
  // slow minor drone: D, A, F with detuned saws through a moving lowpass
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 2; lp.connect(mus);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045; const lg = ctx.createGain(); lg.gain.value = 260; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  const freqs = [73.42, 73.6, 110, 87.3, 146.8];
  musNodes = freqs.map((fr, i) => { const o = ctx.createOscillator(); o.type = i === 4 ? 'triangle' : 'sawtooth'; o.frequency.value = fr; const g = ctx.createGain(); g.gain.value = i === 4 ? 0.05 : 0.08; o.connect(g); g.connect(lp); o.start(); return o; });
  // boss layer: pulsing low beat + tritone, silent until boss
  const bg = ctx.createGain(); bg.gain.value = 0; bg.connect(mus);
  const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55; const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 77.78;
  const bl = ctx.createBiquadFilter(); bl.type = 'lowpass'; bl.frequency.value = 300; o1.connect(bl); o2.connect(bl);
  const pulse = ctx.createGain(); pulse.gain.value = 0.5; bl.connect(pulse); pulse.connect(bg);
  const pl = ctx.createOscillator(); pl.type = 'square'; pl.frequency.value = 2.0; const pg = ctx.createGain(); pg.gain.value = 0.45; pl.connect(pg); pg.connect(pulse.gain);
  o1.start(); o2.start(); pl.start(); bossLayer = bg;
}
AU.bossMusic = (on) => { if (!ctx || !bossLayer) return; bossLayer.gain.setTargetAtTime(on ? 0.9 : 0, now(), on ? 1.5 : 2.5); mus.gain.setTargetAtTime(on ? 0.4 : 0.28, now(), 1.5); };
AU.musicDuck = (v) => { if (ctx) mus.gain.setTargetAtTime(v, now(), 0.8); };
})();
