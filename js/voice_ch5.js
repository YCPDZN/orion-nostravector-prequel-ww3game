/* Chapter V recordings: line number (see the numbered Chapter V script) -> length in seconds. voice/ch5_NN.mp3
   Lines without a recording are subtitled (Yi Liang and Orlov fall back to text-to-speech). */
window.CH5_VO = {"1": 6.69, "2": 7.16, "3": 3.08, "4": 2.27, "5": 5.80, "6": 4.60, "7": 13.56, "8": 7.71, "9": 5.07, "10": 7.39, "11": 4.75, "12": 4.05, "13": 6.53, "14": 5.41, "15": 5.56, "16": 5.96, "17": 5.56, "18": 5.41, "19": 5.33, "20": 4.91, "21": 1.72, "22": 4.05, "23": 2.69, "24": 6.84, "25": 3.97, "26": 7.39, "27": 5.33, "28": 6.43, "29": 5.15, "30": 4.83, "31": 6.53, "32": 4.60, "33": 4.44, "34": 5.25, "35": 2.85};
const rec5 = (n) => (n && window.CH5_VO[n]) ? n : 0;
GM.vo5 = (n) => { const r = rec5(n); return r ? 'voice/ch5_' + String(r).padStart(2, '0') + '.mp3' : undefined; };
GM.voDur5 = (n, base) => { const r = rec5(n); return r ? Math.max(base || 0, window.CH5_VO[r] + 0.4) : base; };
(function () { const prev = GM.voSet; GM.voSet = (k) => k === 5 ? [GM.vo5, GM.voDur5] : prev(k); })();
