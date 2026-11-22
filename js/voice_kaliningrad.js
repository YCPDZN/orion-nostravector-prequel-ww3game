/* Chapter IV recordings: line number (see the numbered Kaliningrad script) -> length in seconds. voice/kaliningradNN.mp3
   Empty until the lines are recorded: every line is subtitled (bosses use text-to-speech) until then. */
window.KALININGRAD_VO = {};
const rec4 = (n) => (n && window.KALININGRAD_VO[n]) ? n : 0;
GM.vo4 = (n) => { const r = rec4(n); return r ? 'voice/kaliningrad' + String(r).padStart(2, '0') + '.mp3' : undefined; };
GM.voDur4 = (n, base) => { const r = rec4(n); return r ? Math.max(base || 0, window.KALININGRAD_VO[r] + 0.4) : base; };
/* which numbered voice set a line belongs to: 3 = Normandy, 4 = Kaliningrad, anything else = Dover */
GM.voSet = (k) => k === 3 ? [GM.vo3, GM.voDur3] : k === 4 ? [GM.vo4, GM.voDur4] : [GM.vo, GM.voDur];
