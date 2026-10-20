export function lines(s) { return s.split(/\r?\n/).map(v => v.trim()).filter(Boolean); }
export function randomInt(max) { if (!Number.isInteger(max) || max < 1 || max > 0x100000000)
    throw Error('抽取範圍無效'); const a = new Uint32Array(1); const limit = Math.floor(0x100000000 / max) * max; do {
    crypto.getRandomValues(a);
} while (a[0] >= limit); return a[0] % max; }
export function shuffle(a, pick = (n) => randomInt(n)) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [b[i], b[j]] = [b[j], b[i]];
} return b; }
export function groupNames(a, count) { if (count < 1 || count > a.length)
    throw Error('組數需介於 1 與參與人數之間'); const g = Array.from({ length: count }, () => []); shuffle(a).forEach((v, i) => g[i % count].push(v)); return g; }
export function csv(rows) { return '\ufeff' + rows.map(row => row.map(v => '"' + String(v).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"').join(',')).join('\r\n'); }
export function remaining(deadline, now = Date.now()) { return Math.max(0, Math.ceil((deadline - now) / 1000)); }
