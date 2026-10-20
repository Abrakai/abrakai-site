"use strict";
const canvas = document.getElementById('displayCanvas');
let last = null;
let lastSeen = 0;
function text(tag, s) { const e = document.createElement(tag); e.textContent = s; return e; }
function draw(d) {
    if (d.type !== 'display' || typeof d.source !== 'string' || typeof d.text !== 'string' || d.text.length > 100000)
        return;
    last = d;
    lastSeen = Date.now();
    document.getElementById('displayTitle').textContent = typeof d.title === 'string' ? d.title : 'Co-Space';
    canvas.replaceChildren();
    if (d.source === 'timerScreen') {
        const caption = text('p', d.text);
        caption.style.fontSize = Math.max(28, Math.min(100, Number(d.size) || 48)) + 'px';
        canvas.append(caption, text('strong', ''));
        tick();
    }
    else if (d.source === 'scoreScreen' && Array.isArray(d.teams)) {
        const grid = document.createElement('div');
        grid.className = 'grid';
        for (const t of d.teams.slice(0, 30)) {
            if (!t || typeof t.name !== 'string' || typeof t.score !== 'number')
                continue;
            const box = document.createElement('div');
            box.className = 'team';
            box.append(text('p', t.name), text('strong', String(t.score)));
            grid.append(box);
        }
        canvas.append(grid);
    }
    else if (d.source === 'groupResults' && Array.isArray(d.groups)) {
        const grid = document.createElement('div');
        grid.className = 'grid';
        for (const g of d.groups.slice(0, 500)) {
            if (!g || typeof g.name !== 'string' || !Array.isArray(g.members))
                continue;
            const box = document.createElement('div');
            box.className = 'team';
            box.append(text('h2', g.name), text('p', g.members.filter((m) => typeof m === 'string').join('、')));
            grid.append(box);
        }
        canvas.append(grid);
    }
    else {
        const p = text('p', d.text || '等待內容');
        p.className = 'display-text';
        if (d.source === 'boardScreen')
            p.style.fontSize = Math.max(24, Math.min(100, Number(d.size) || 48)) + 'px';
        canvas.append(p);
    }
}
function tick() { if (last?.source === 'timerScreen') {
    let n = Number(last.seconds) || 0;
    if (last.running && typeof last.deadline === 'number')
        n = Math.max(0, Math.ceil((last.deadline - Date.now()) / 1000));
    const e = canvas.querySelector('strong');
    if (e) {
        e.className = 'display-clock';
        e.textContent = Math.floor(n / 60).toString().padStart(2, '0') + ':' + (n % 60).toString().padStart(2, '0');
    }
} document.getElementById('displayConnection').textContent = lastSeen && Date.now() - lastSeen > 15000 ? '講師控制頁可能已離開；目前保留最後展示內容。' : '本機投影模式 · 講師設定不會出現在此頁'; }
try {
    const channel = new BroadcastChannel('cospace-display-v1');
    channel.onmessage = e => { if (e.data && typeof e.data === 'object')
        draw(e.data); };
    channel.postMessage({ type: 'ready' });
}
catch { /* opener fallback */ }
window.addEventListener('message', e => { if (e.origin !== location.origin || e.source !== window.opener)
    return; if (e.data && typeof e.data === 'object')
    draw(e.data); });
if (window.opener)
    window.opener.postMessage({ type: 'ready' }, location.origin);
document.getElementById('displayFull').onclick = () => { if (document.documentElement.requestFullscreen)
    void document.documentElement.requestFullscreen().catch(() => { document.getElementById('displayConnection').textContent = '此瀏覽器不支援全螢幕，請放大視窗。'; }); };
setInterval(tick, 250);
