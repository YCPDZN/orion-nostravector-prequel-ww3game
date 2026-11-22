/* Opening scene — a soft, out-of-focus memory narrated by Orion in the first person.
   Drawn with a 2D canvas behind a CSS blur so everything reads as a half-remembered dream. */
(function () {
'use strict';
const $ = (id) => document.getElementById(id);
const B = window.GM.birth = { active: false };
let voices = [], voiceEl = null;
let cv, cx, raf = 0, t0 = 0, lineIdx = -1, lineTimer = 0, fadeTimer = 0, onDone = null, lines = [], beatT = 0;
const rnd = (a, b) => a + (b - a) * Math.random();
const bokeh = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(0.02, 0.09), s: rnd(0.004, 0.015), a: rnd(0.15, 0.5), warm: Math.random() < 0.7 }));

function draw(now) {
  raf = requestAnimationFrame(draw);
  const t = (now - t0) / 1000; const W = cv.width = cv.clientWidth, H = cv.height = cv.clientHeight; const m = Math.min(W, H);
  const stage = Math.max(0, lineIdx); // the scene slowly reveals more as the narration goes on
  // warm white room light
  const g = cx.createRadialGradient(W * 0.5, H * 0.35, m * 0.05, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
  g.addColorStop(0, '#fff8ec'); g.addColorStop(0.45, '#f1dcc0'); g.addColorStop(1, '#6d5644');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  // overhead lights drifting slowly past
  for (let i = 0; i < 3; i++) {
    const y = ((t * 0.035 + i / 3) % 1.2 - 0.1) * H; const x = W * 0.5 + Math.sin(t * 0.2 + i) * W * 0.05;
    const lg = cx.createRadialGradient(x, y, 0, x, y, m * 0.35); lg.addColorStop(0, 'rgba(255,255,250,0.95)'); lg.addColorStop(1, 'rgba(255,250,235,0)');
    cx.fillStyle = lg; cx.fillRect(0, 0, W, H);
  }
  // a window with the city lights far away (from the 4th line)
  const wv = Math.min(1, Math.max(0, stage - 2.6)); if (wv > 0) {
    const wx = W * 0.78, wy = H * 0.32, ww = m * 0.34, wh = m * 0.42;
    cx.globalAlpha = 0.75 * wv; cx.fillStyle = '#1d2b47'; cx.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
    for (let i = 0; i < 26; i++) { const px = wx - ww / 2 + ((i * 37) % 100) / 100 * ww, py = wy + wh * 0.05 + ((i * 53) % 100) / 100 * wh * 0.42;
      cx.fillStyle = i % 3 ? '#ffd38a' : '#fff1c9'; cx.globalAlpha = wv * (0.6 + 0.4 * Math.sin(t * 2 + i)); cx.beginPath(); cx.arc(px, py, m * 0.008, 0, 7); cx.fill(); }
    cx.globalAlpha = 1;
  }
  // bokeh
  for (const b of bokeh) {
    const x = (b.x + Math.sin(t * b.s * 6 + b.y * 9) * 0.03) * W, y = ((b.y - t * b.s) % 1 + 1) % 1 * H; const r = b.r * m;
    const bg = cx.createRadialGradient(x, y, 0, x, y, r); const c = b.warm ? '255,226,170' : '220,235,255';
    bg.addColorStop(0, `rgba(${c},${b.a})`); bg.addColorStop(1, `rgba(${c},0)`); cx.fillStyle = bg; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill();
  }
  // heartbeat: a gentle pulse of the vignette
  beatT += 1 / 60; const bp = beatT % 1.05; const pulse = Math.exp(-bp * 9) + 0.6 * Math.exp(-Math.max(0, bp - 0.22) * 9) * (bp > 0.22 ? 1 : 0);
  if (bp < 1 / 60 && B.active) window.AU && AU.heartbeat && AU.heartbeat();
  const vg = cx.createRadialGradient(W / 2, H / 2, m * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(20,8,4,${0.55 + pulse * 0.12})`); cx.fillStyle = vg; cx.fillRect(0, 0, W, H);
  // focus breathes in and out, but never quite sharpens
  const blur = 10 + Math.sin(t * 0.45) * 4 - Math.min(4, stage * 0.6);
  cv.style.filter = `blur(${blur.toFixed(1)}px) saturate(0.85)`;
}

function next() {
  clearTimeout(lineTimer); clearTimeout(fadeTimer); stopVoice();
  const ps = $('birthTxt').querySelectorAll('p'); ps.forEach((p) => p.style.opacity = 0);
  lineIdx++;
  if (lineIdx >= lines.length) return finish();
  const p = ps[lineIdx]; const delay = lineIdx ? 900 : 1600; const v = voices[lineIdx];
  fadeTimer = setTimeout(() => { if (!B.active) return; p.style.opacity = 1; if (v) playVoice(v[0]); }, delay);
  const readT = 2200 + p.textContent.length * 60; // hold each line until Orion has finished speaking
  lineTimer = setTimeout(next, delay + (v ? Math.max(readT, v[1] * 1000 + 1300) : readT));
}
function stopVoice() { if (voiceEl) { try { voiceEl.pause(); } catch (e) { } voiceEl = null; } }
function playVoice(src) {
  stopVoice();
  try { voiceEl = new Audio(src); voiceEl.volume = Math.min(1, ((window.GM && GM.settings ? GM.settings.vol : 8) / 10) + 0.15); const pr = voiceEl.play(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { }
}
function finish() {
  stopVoice();
  if (!B.active) return; B.active = false; clearTimeout(lineTimer); clearTimeout(fadeTimer);
  const el = $('birth'); el.style.transition = 'opacity 2.2s'; el.style.opacity = 0;
  setTimeout(() => { cancelAnimationFrame(raf); el.classList.add('hidden'); el.style.opacity = 1; if (onDone) onDone(); }, 2300);
}
B.start = function (opening, done) {
  lines = opening.lines; voices = opening.voice || []; onDone = done; lineIdx = -1; B.active = true; t0 = performance.now(); beatT = 0;
  cv = $('birthCv'); cx = cv.getContext('2d');
  $('birthYear').textContent = opening.year;
  $('birthTxt').innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
  const el = $('birth'); el.classList.remove('hidden'); el.style.transition = 'none'; el.style.opacity = 0;
  requestAnimationFrame(() => { el.style.transition = 'opacity 2.5s'; el.style.opacity = 1; });
  raf = requestAnimationFrame(draw); next();
};
B.advance = function () { if (B.active && lineIdx >= 0) next(); };
B.skip = function () { if (B.active) { lineIdx = lines.length; finish(); } };
})();
