/* Chapter IV recordings: line number (see the numbered Kaliningrad script) -> length in seconds. voice/kaliningradNN.mp3
   Lines without a recording are subtitled (the bosses fall back to text-to-speech). */
window.KALININGRAD_VO = {"1": 5.80, "2": 4.05, "3": 2.77, "4": 2.27, "5": 4.60, "6": 2.59, "7": 4.13, "8": 3.55, "9": 3.32, "10": 1.80, "11": 3.97, "12": 1.80, "13": 6.43, "14": 6.61, "15": 2.85, "16": 4.13, "17": 3.08, "18": 4.13, "19": 3.08, "20": 2.27, "21": 2.04, "22": 2.27};
const rec4 = (n) => (n && window.KALININGRAD_VO[n]) ? n : 0;
GM.vo4 = (n) => { const r = rec4(n); return r ? 'voice/kaliningrad' + String(r).padStart(2, '0') + '.mp3' : undefined; };
GM.voDur4 = (n, base) => { const r = rec4(n); return r ? Math.max(base || 0, window.KALININGRAD_VO[r] + 0.4) : base; };
/* which numbered voice set a line belongs to: 3 = Normandy, 4 = Kaliningrad, anything else = Dover */
GM.voSet = (k) => k === 3 ? [GM.vo3, GM.voDur3] : k === 4 ? [GM.vo4, GM.voDur4] : [GM.vo, GM.voDur];
