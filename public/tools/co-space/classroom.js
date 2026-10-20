import { lines, randomInt, shuffle, groupNames, csv, remaining } from './classroom-core.js';
const $ = (id) => { const e = document.getElementById(id); if (!e)
    throw Error('缺少元件 ' + id); return e; };
const input = (id) => $(id);
const area = (id) => $(id);
const val = (id) => input(id).value.trim();
const esc = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function say(s, error = false) { $('status').textContent = (error ? '⚠ ' : '✓ ') + s; $('status').classList.toggle('error', error); }
function action(id, fn) { $(id).addEventListener('click', () => { try {
    fn();
}
catch (e) {
    say(e instanceof Error ? e.message : '操作未完成，請再試一次', true);
} }); }
function saveFile(name, rows) { const u = URL.createObjectURL(new Blob([csv(rows)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 10000); say('已準備下載；儲存位置由瀏覽器決定。'); }
const toolDefs = [['timer', '⏱ 計時／休息'], ['lottery', '🎁 抽獎'], ['rollcall', '🙋 點名'], ['groups', '👥 分組'], ['board', '📝 大字板'], ['scores', '🏆 計分板'], ['topics', '💡 抽題']];
function selectTool(id) { for (const [key] of toolDefs)
    $(key).hidden = key !== id; document.querySelectorAll('#toolnav button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === id))); $('roster').hidden = !['lottery', 'rollcall', 'groups'].includes(id); $('status').textContent = ''; }
for (const [id, label] of toolDefs) {
    const b = document.createElement('button');
    b.textContent = label;
    b.dataset.tool = id;
    b.type = 'button';
    b.addEventListener('click', () => selectTool(id));
    $('toolnav').append(b);
}
selectTool('timer');
let names = [];
let called = new Set();
let exclusions = new Set();
let callOrder = [];
let prizes = [];
let wins = [];
let nextPrize = 1;
function updateRoster() { $('rosterCount').textContent = names.length + ' 人'; $('exclusions').replaceChildren(); names.forEach((name, i) => { const l = document.createElement('label'); l.className = 'check'; const c = document.createElement('input'); c.type = 'checkbox'; c.checked = exclusions.has(i); c.addEventListener('change', () => c.checked ? exclusions.add(i) : exclusions.delete(i)); l.append(c, document.createTextNode('排除 ' + name)); $('exclusions').append(l); }); }
function persist() { try {
    if (input('remember').checked)
        localStorage.setItem('cospace-classroom-roster-v1', JSON.stringify(names));
    else
        localStorage.removeItem('cospace-classroom-roster-v1');
}
catch {
    say('瀏覽器無法保存名單，目前仍可在本頁使用。', true);
} }
function applyRoster() { if (wins.length)
    throw Error('請先下載並清除抽獎紀錄，再變更名單。'); const a = lines(area('names').value); if (a.length > 500)
    throw Error('單堂名單最多 500 人'); if (a.some(v => v.length > 100))
    throw Error('每位名稱請控制在 100 字以內'); if (new Set(a).size !== a.length)
    throw Error('名單有相同名稱，請加座號或編號後再套用。'); names = a; called.clear(); exclusions.clear(); callOrder = []; $('callHistory').textContent = ''; $('calledName').textContent = '準備邀請分享'; $('groupResults').replaceChildren(); updateRoster(); persist(); say('已套用 ' + names.length + ' 人；點名與分組已重設。'); }
action('applyNames', applyRoster);
action('clearNames', () => { if (wins.length)
    throw Error('已有抽獎紀錄，請先下載並清除抽獎紀錄。'); area('names').value = ''; input('remember').checked = false; applyRoster(); });
input('remember').addEventListener('change', persist);
try {
    const a = JSON.parse(localStorage.getItem('cospace-classroom-roster-v1') || 'null');
    if (Array.isArray(a) && a.length <= 500 && a.every(v => typeof v === 'string' && v.length <= 100)) {
        names = a;
        area('names').value = names.join('\n');
        input('remember').checked = true;
        updateRoster();
    }
}
catch { /* no saved data */ }
// Timer uses a deadline instead of relying on interval tick counts.
let secondsLeft = 300;
let deadline = 0;
let running = false;
let initial = 300;
let context = null;
function syncProject() { if (projectSource) {
    const clone = $(projectSource).cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    $('projectContent').replaceChildren(clone);
} }
function renderTimer() { if (running)
    secondsLeft = remaining(deadline); $('clock').textContent = Math.floor(secondsLeft / 60).toString().padStart(2, '0') + ':' + (secondsLeft % 60).toString().padStart(2, '0'); $('timerCaption').textContent = val('timerLabel') || '課堂倒數'; $('timerState').textContent = running ? '進行中' : secondsLeft === 0 ? '時間到！' : secondsLeft === initial ? '尚未開始' : '已暫停'; $('timerStart').disabled = running; $('timerPause').disabled = !running; if (projectSource === 'timerScreen')
    syncProject(); }
function beep() { if (!input('sound').checked || !context)
    return; try {
    const osc = context.createOscillator(), gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    gain.gain.value = .12;
    osc.frequency.value = 660;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .7);
    osc.stop(context.currentTime + .8);
}
catch {
    say('時間到；裝置未能播放提示音。', true);
} }
action('timerStart', () => { if (running)
    return; if (secondsLeft <= 0) {
    secondsLeft = Number(val('minutes')) * 60 + Number(val('seconds'));
} if (!Number.isFinite(secondsLeft) || secondsLeft <= 0 || secondsLeft > 10859)
    throw Error('請設定有效時間，最多 180 分 59 秒'); if (input('sound').checked) {
    try {
        context ?? (context = new AudioContext());
        void context.resume().catch(() => say('計時已開始，但提示音尚未獲裝置允許。', true));
    }
    catch {
        say('此裝置不支援提示音，計時仍可使用。', true);
    }
} deadline = Date.now() + secondsLeft * 1000; running = true; renderTimer(); });
action('timerPause', () => { if (running)
    secondsLeft = remaining(deadline); running = false; renderTimer(); });
action('timerAdd', () => { if (running) {
    secondsLeft = remaining(deadline);
    deadline += 60000;
} secondsLeft = Math.min(10859, secondsLeft + 60); if (running)
    deadline = Date.now() + secondsLeft * 1000; renderTimer(); });
function resetTimer() { const m = Number(val('minutes')), s = Number(val('seconds')); if (!Number.isInteger(m) || !Number.isInteger(s) || m < 0 || m > 180 || s < 0 || s > 59)
    throw Error('分鐘需為 0–180，秒數為 0–59'); running = false; secondsLeft = initial = m * 60 + s; renderTimer(); }
action('timerReset', resetTimer);
for (const id of ['minutes', 'seconds'])
    input(id).addEventListener('change', () => { if (!running)
        try {
            resetTimer();
        }
        catch (e) {
            say(e.message, true);
        } });
input('timerLabel').addEventListener('input', renderTimer);
document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => { input('minutes').value = String(Number(b.dataset.preset) / 60); input('seconds').value = '0'; resetTimer(); }));
setInterval(() => { if (!running)
    return; renderTimer(); if (secondsLeft === 0) {
    running = false;
    renderTimer();
    beep();
    say('時間到！');
} }, 250);
document.addEventListener('visibilitychange', () => { if (!document.hidden && running)
    renderTimer(); });
function renderPrizes() { $('prizes').replaceChildren(); prizes.forEach(p => { const li = document.createElement('li'); const used = wins.filter(w => w.prizeId === p.id).length; li.textContent = p.name + '：剩餘 ' + (p.qty - used) + '／' + p.qty + ' 位 '; if (!used) {
    const b = document.createElement('button');
    b.textContent = '移除';
    b.onclick = () => { prizes = prizes.filter(v => v.id !== p.id); renderPrizes(); };
    li.append(b);
} $('prizes').append(li); }); input('repeatWinner').disabled = wins.length > 0; }
action('addPrize', () => { const name = val('prizeName'), qty = Number(val('prizeQty')); if (!name || !Number.isInteger(qty) || qty < 1 || qty > 500)
    throw Error('請輸入獎品，數量為 1–500 的整數'); prizes.push({ id: nextPrize++, name, qty }); input('prizeName').value = ''; renderPrizes(); say('已加入獎品。'); });
action('drawPrize', () => { if (!names.length)
    throw Error('請先展開共用課堂名單，輸入並套用名單。'); const p = prizes.find(p => wins.filter(w => w.prizeId === p.id).length < p.qty); if (!p)
    throw Error('請先加入獎品，或所有獎品已抽完。'); const eligible = names.map((_, i) => i).filter(i => !wins.some(w => w.person === i && (w.prizeId === p.id || !input('repeatWinner').checked))); if (!eligible.length)
    throw Error('可中獎人數不足；已保留結果，請調整後續獎品或結束本輪。'); const i = eligible[randomInt(eligible.length)]; wins.push({ person: i, name: names[i], prizeId: p.id, prize: p.name, time: new Date().toLocaleString('zh-TW') }); $('winner').textContent = names[i] + ' · ' + p.name; const li = document.createElement('li'); li.textContent = p.name + '：' + names[i]; $('winners').append(li); renderPrizes(); syncProject(); say('已抽出 ' + names[i] + '；結果已登記。'); });
action('exportWinners', () => { if (!wins.length)
    throw Error('目前尚無得獎紀錄'); saveFile('CoSpace-得獎名單.csv', [['獎品', '得獎者', '時間'], ...wins.map(w => [w.prize, w.name, w.time])]); });
action('resetLottery', () => { if (wins.length && !window.confirm('清除後無法復原，請先下載得獎紀錄。確定清除本輪結果？'))
    return; wins = []; $('winners').replaceChildren(); $('winner').textContent = '等待抽獎'; renderPrizes(); say('抽獎紀錄已清除，獎品可重新抽取。'); });
action('pickName', () => { const pool = names.map((_, i) => i).filter(i => !called.has(i) && !exclusions.has(i)); if (!pool.length)
    throw Error(names.length ? '本輪已點完或所有人已排除；可開始新一輪。' : '請先套用共用名單。'); const i = pool[randomInt(pool.length)]; called.add(i); callOrder.push(names[i]); $('calledName').textContent = names[i]; $('callHistory').textContent = '已點名 ' + callOrder.length + ' 位：' + callOrder.join('、'); syncProject(); });
action('resetCalls', () => { called.clear(); callOrder = []; $('callHistory').textContent = ''; $('calledName').textContent = '新一輪準備開始'; say('已重設點名；排除名單保留。'); });
function getGroups() { return Array.from(document.querySelectorAll('#groupResults .group')).map(e => ({ name: e.querySelector('input').value.trim() || '未命名組別', members: lines(e.querySelector('textarea').value) })); }
action('makeGroups', () => { if (!names.length)
    throw Error('請先套用共用名單'); const n = Number(val('groupCount')); if (!Number.isInteger(n) || n < 1 || n > 500)
    throw Error('數量請填 1–500 整數'); const count = val('groupMode') === 'size' ? Math.ceil(names.length / n) : n; const groups = groupNames(names, count); $('groupResults').innerHTML = groups.map((g, i) => '<div class="group"><label>組名<input maxlength="60" value="第 ' + (i + 1) + ' 組"></label><label>成員（每行一人）<textarea rows="5" maxlength="20000">' + esc(g.join('\n')) + '</textarea></label></div>').join(''); say('分組完成，可編輯組名與成員。'); });
action('exportGroups', () => { const g = getGroups(); if (!g.length)
    throw Error('請先產生分組'); saveFile('CoSpace-分組.csv', [['組別', '成員'], ...g.flatMap(v => v.members.map(n => [v.name, n]))]); });
function renderBoard() { const out = $('boardOutput'); out.textContent = area('boardText').value || '在上方輸入要投影的文字'; out.style.fontSize = val('boardSize') + 'px'; $('boardScreen').classList.toggle('light', val('boardTheme') === 'light'); syncProject(); }
for (const id of ['boardText', 'boardSize', 'boardTheme'])
    $(id).addEventListener('input', renderBoard);
let teams = [];
let undo = [];
const snapshot = () => teams.map(t => ({ ...t }));
function rememberScore() { undo.push(snapshot()); if (undo.length > 100)
    undo.shift(); }
function renderTeams() { $('teams').replaceChildren(); teams.forEach((t, i) => { const d = document.createElement('div'); d.className = 'team'; const name = document.createElement('p'); name.textContent = t.name; const num = document.createElement('strong'); num.textContent = String(t.score); d.append(name, num); for (const delta of [-1, 1]) {
    const b = document.createElement('button');
    b.textContent = delta > 0 ? '＋1' : '−1';
    b.setAttribute('aria-label', t.name + (delta > 0 ? '加一分' : '減一分'));
    b.onclick = () => { rememberScore(); teams[i].score += delta; renderTeams(); };
    d.append(b);
} $('teams').append(d); }); syncProject(); }
action('addTeam', () => { const n = val('teamName'); if (!n)
    throw Error('請輸入組名'); if (teams.length >= 30)
    throw Error('計分板最多 30 組'); rememberScore(); teams.push({ name: n, score: 0 }); input('teamName').value = ''; renderTeams(); });
action('undoScore', () => { const old = undo.pop(); if (!old)
    throw Error('沒有可復原的調整'); teams = old; renderTeams(); });
action('resetScores', () => { rememberScore(); teams = teams.map(t => ({ ...t, score: 0 })); renderTeams(); say('分數已歸零，可按復原。'); });
action('exportScores', () => { if (!teams.length)
    throw Error('請先新增組別'); saveFile('CoSpace-計分.csv', [['組別', '分數'], ...teams.map(t => [t.name, t.score])]); });
action('groupsToScores', () => { const g = getGroups(); if (!g.length)
    throw Error('請先產生分組'); if (g.length > 30)
    throw Error('計分板最多 30 組'); if (teams.length && !window.confirm('用目前組名取代計分板，分數從零開始；可按復原返回。'))
    return; rememberScore(); teams = g.map(v => ({ name: v.name, score: 0 })); renderTeams(); selectTool('scores'); say('已帶入 ' + g.length + ' 個組名。'); });
let topics = [];
let topicPool = [];
action('applyTopics', () => { topics = lines(area('topicList').value); if (topics.length > 500)
    throw Error('最多 500 題'); topicPool = shuffle(topics); $('topicOutput').textContent = '題目已就緒'; $('topicProgress').textContent = '尚餘 ' + topicPool.length + ' 題'; say('已套用 ' + topics.length + ' 題。'); });
action('pickTopic', () => { if (!topicPool.length)
    throw Error('請先套用題目，或開始新一輪'); $('topicOutput').textContent = topicPool.pop(); $('topicProgress').textContent = '尚餘 ' + topicPool.length + '／' + topics.length + ' 題'; syncProject(); });
action('resetTopics', () => { topicPool = shuffle(topics); $('topicOutput').textContent = '新一輪準備開始'; $('topicProgress').textContent = '尚餘 ' + topicPool.length + ' 題'; });
// Projector renders a safe copy of the current tool display.
let projectSource = '';
function closeProject() { const d = $('projector'); if (d.open)
    d.close(); if (document.fullscreenElement)
    void document.exitFullscreen().catch(() => { }); }
// Projection snapshots keep controls in the underlying tool; scoreboard buttons are forwarded explicitly.
document.querySelectorAll('[data-project]').forEach(b => b.addEventListener('click', () => { projectSource = b.dataset.project; syncProject(); const d = $('projector'); d.showModal(); if (d.requestFullscreen)
    void d.requestFullscreen().catch(() => { }); }));
$('projectContent').addEventListener('click', e => { const target = e.target.closest('button'); if (!target || projectSource !== 'scoreScreen')
    return; const btns = Array.from($('projectContent').querySelectorAll('button')); const index = btns.indexOf(target); const original = $('scoreScreen').querySelectorAll('button')[index]; original?.click(); });
action('exitProject', closeProject);
$('projector').addEventListener('close', () => { projectSource = ''; $('projectContent').replaceChildren(); if (document.fullscreenElement)
    void document.exitFullscreen().catch(() => { }); });
renderTimer();
renderBoard();
