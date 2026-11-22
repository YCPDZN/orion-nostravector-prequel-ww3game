/* Chapter III recordings: line number (see the numbered Normandy script) -> length in seconds. voice/normandyNN.mp3 */
window.NORMANDY_VO = {"1": 9.72, "2": 2.85, "3": 4.44, "4": 3.00, "5": 4.05, "6": 3.00, "7": 2.85, "8": 6.27, "9": 2.51, "10": 4.44, "11": 3.16, "12": 4.05, "13": 2.12, "14": 2.27, "15": 3.32, "16": 3.16, "17": 3.24, "18": 3.00, "19": 3.24, "20": 5.33, "21": 4.36, "22": 4.44, "23": 2.93, "24": 3.87, "25": 2.85, "26": 1.41, "27": 1.88, "28": 6.53, "29": 4.28, "30": 3.00, "31": 2.27, "32": 1.41, "33": 2.35, "34": 4.68, "35": 2.77, "36": 2.93, "37": 2.35, "38": 3.40, "39": 5.41, "40": 4.99, "41": 2.93, "42": 3.16, "43": 2.59, "44": 1.31};
const rec3 = (n) => (n && window.NORMANDY_VO[n]) ? n : 0;
GM.vo3 = (n) => { const r = rec3(n); return r ? 'voice/normandy' + String(r).padStart(2, '0') + '.mp3' : undefined; };
GM.voDur3 = (n, base) => { const r = rec3(n); return r ? Math.max(base || 0, window.NORMANDY_VO[r] + 0.4) : base; };
