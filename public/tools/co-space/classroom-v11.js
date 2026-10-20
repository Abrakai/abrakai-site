import { validLesson, youtubeURL } from './classroom-state-v11.js';
let booted = false;
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
const toolDefs = [['timer', '⏱ 計時／休息'], ['lottery', '🎁 抽獎'], ['groups', '👥 分組'], ['board', '📝 大字板'], ['scores', '🏆 計分板'], ['topics', '💡 抽題']];
function selectTool(id) { for (const key of [...toolDefs.map(t => t[0]), 'rollcall'])
    $(key).hidden = key !== id; document.querySelectorAll('#toolnav button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === id))); $('roster').hidden = !['lottery', 'rollcall', 'groups'].includes(id); $('status').textContent = ''; document.body.dataset.tool = id; }
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
function syncProject() { if (booted)
    sendDisplay(); if (projectSource) {
    const clone = $(projectSource).cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    $('projectContent').replaceChildren(clone);
} }
function renderTimer() { if (running)
    secondsLeft = remaining(deadline); $('clock').textContent = Math.floor(secondsLeft / 60).toString().padStart(2, '0') + ':' + (secondsLeft % 60).toString().padStart(2, '0'); $('timerCaption').textContent = val('timerLabel') || '課堂倒數'; $('timerCaption').style.fontSize = val('captionSize') + 'px'; $('timerState').textContent = running ? '進行中' : secondsLeft === 0 ? '時間到！' : secondsLeft === initial ? '尚未開始' : '已暫停'; $('timerStart').disabled = running; $('timerPause').disabled = !running; if (projectSource === 'timerScreen')
    syncProject(); if (booted)
    sendDisplay(); }
async function beep(test = false) {
    if (!test && !input('sound').checked)
        return;
    try {
        context ?? (context = new AudioContext());
        await context.resume();
        if (context.state !== 'running')
            throw Error('音訊尚未啟用');
        const volume = Number(val('alarmVolume')) / 100 * .28;
        const now = context.currentTime;
        for (const start of [0, .28, .56, 1.15, 1.43, 1.71]) {
            const o = context.createOscillator(), g = context.createGain();
            o.type = 'sine';
            o.frequency.value = 880;
            o.connect(g);
            g.connect(context.destination);
            g.gain.setValueAtTime(0, now + start);
            g.gain.linearRampToValueAtTime(volume, now + start + .015);
            g.gain.setValueAtTime(volume, now + start + .13);
            g.gain.linearRampToValueAtTime(0, now + start + .18);
            o.start(now + start);
            o.stop(now + start + .2);
        }
        if (test)
            say('已送出六聲提示音，請確認裝置音量與音訊輸出。');
    }
    catch {
        say('提示音未能播放，請按「試聽提示音」啟用，並檢查音量及音訊輸出。', true);
    }
}
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
} $('prizes').append(li); }); input('repeatWinner').disabled = wins.length > 0; updateLotteryGuide(); }
action('addPrize', () => { const name = val('prizeName'), qty = Number(val('prizeQty')); if (!name || !Number.isInteger(qty) || qty < 1 || qty > 500)
    throw Error('請輸入獎品，數量為 1–500 的整數'); if (prizes.length >= 100)
    throw Error('最多 100 種獎品'); prizes.push({ id: nextPrize++, name, qty }); input('prizeName').value = ''; renderPrizes(); say('已加入獎品。'); });
function performDraw() { if (drawing)
    return; if (!names.length)
    throw Error('請先展開共用課堂名單，輸入並套用名單。'); const p = prizes.find(p => wins.filter(w => w.prizeId === p.id).length < p.qty); if (!p)
    throw Error('請先加入獎品，或所有獎品已抽完。'); const eligible = names.map((_, i) => i).filter(i => !wins.some(w => w.person === i && (w.prizeId === p.id || !input('repeatWinner').checked))); if (!eligible.length)
    throw Error('可中獎人數不足；已保留結果，請調整後續獎品或結束本輪。'); const i = eligible[randomInt(eligible.length)]; wins.push({ person: i, name: names[i], prizeId: p.id, prize: p.name, time: new Date().toLocaleString('zh-TW') }); const revealed = names[i] + ' · ' + p.name; const li = document.createElement('li'); li.textContent = p.name + '：' + names[i]; $('winners').append(li); renderPrizes(); drawing = true; setDrawingLock(true); saveProject(); animateWinner(revealed); }
;
action('drawPrize', performDraw);
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
const teamSnapshot = () => teams.map(t => ({ ...t }));
function rememberScore() { undo.push(teamSnapshot()); if (undo.length > 100)
    undo.shift(); }
function renderTeams() { $('teams').replaceChildren(); teams.forEach((t, i) => { const d = document.createElement('div'); d.className = 'team'; const name = document.createElement('p'); name.textContent = t.name; const num = document.createElement('strong'); num.textContent = String(t.score); d.append(name, num); for (const sign of [-1, 1]) {
    const step = Math.max(1, Math.min(1000000, Math.trunc(Number(val('scoreStep')) || 1)));
    const delta = sign * step;
    const b = document.createElement('button');
    b.textContent = (sign > 0 ? '＋' : '−') + step;
    b.setAttribute('aria-label', t.name + (sign > 0 ? '加' : '減') + step + '分');
    b.onclick = () => { if (!Number.isSafeInteger(teams[i].score + delta) || Math.abs(teams[i].score + delta) > 1e12) {
        say('分數超出可處理範圍', true);
        return;
    } rememberScore(); teams[i].score += delta; renderTeams(); };
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
// V1.1: durable lesson preparation, guided draw, and isolated public display.
const STATE_KEY = 'cospace-lesson-v1', BACKUP_KEY = 'cospace-lesson-backup-v1';
let revision = '';
let conflict = false;
let dirty = false;
let autosaveTimer = 0;
let displaySource = 'timerScreen';
let displayWindow = null;
let broadcast = null;
try {
    broadcast = new BroadcastChannel('cospace-display-v1');
    broadcast.onmessage = e => { if (e.data?.type === 'ready')
        sendDisplay(); };
}
catch { /* opener postMessage remains available */ }
const controlIDs = ['names', 'remember', 'minutes', 'seconds', 'timerLabel', 'sound', 'alarmVolume', 'captionSize', 'prizeName', 'prizeQty', 'repeatWinner', 'groupMode', 'groupCount', 'boardText', 'boardSize', 'boardTheme', 'teamName', 'scoreStep', 'topicList', 'youtube', 'musicLoop'];
function snapshot() { const controls = {}; for (const id of controlIDs) {
    const e = input(id);
    controls[id] = e.type === 'checkbox' ? e.checked : e.value;
} return { schema: 1, revision, title: val('lessonTitle'), names: [...names], prizes: prizes.map(p => ({ ...p })), wins: wins.map(w => ({ ...w })), nextPrize, teams: snapshotTeams(), undo: undo.map(a => a.map(t => ({ ...t }))), groups: getGroups(), topics: [...topics], pool: [...topicPool], called: [...called], excluded: [...exclusions], callOrder: [...callOrder], controls, timer: { seconds: running ? remaining(deadline) : secondsLeft, initial, deadline, running }, output: { winner: wins.length ? wins[wins.length - 1].name + ' · ' + wins[wins.length - 1].prize : $('winner').textContent || '', topic: $('topicOutput').textContent || '', called: $('calledName').textContent || '' }, tool: document.body.dataset.tool || 'timer' }; }
const snapshotTeams = () => teams.map(t => ({ ...t }));
function renderGroups(g) { $('groupResults').innerHTML = g.map(v => '<div class="group"><label>組名<input maxlength="100" value="' + esc(v.name) + '"></label><label>成員（每行一人）<textarea rows="5" maxlength="20000">' + esc(v.members.join('\n')) + '</textarea></label></div>').join(''); }
function applyLesson(s) { names = [...s.names]; prizes = s.prizes.map(v => ({ ...v })); wins = s.wins.map(v => ({ ...v })); nextPrize = s.nextPrize; teams = s.teams.map(v => ({ ...v })); undo = s.undo.map(a => a.map(v => ({ ...v }))); topics = [...s.topics]; topicPool = [...s.pool]; called = new Set(s.called); exclusions = new Set(s.excluded); callOrder = [...s.callOrder]; for (const id of controlIDs) {
    const e = input(id), v = s.controls[id];
    if (e.type === 'checkbox' && typeof v === 'boolean')
        e.checked = v;
    else if (typeof v === 'string')
        e.value = v;
} input('lessonTitle').value = s.title; secondsLeft = s.timer.seconds; initial = s.timer.initial; deadline = s.timer.deadline; running = s.timer.running && deadline > Date.now(); if (s.timer.running && !running)
    secondsLeft = 0; updateRoster(); renderPrizes(); renderTeams(); renderGroups(s.groups); $('winners').replaceChildren(); for (const w of wins) {
    const li = document.createElement('li');
    li.textContent = w.prize + '：' + w.name;
    $('winners').append(li);
} $('winner').textContent = s.output.winner; $('topicOutput').textContent = s.output.topic; $('calledName').textContent = s.output.called; $('topicProgress').textContent = '尚餘 ' + topicPool.length + '／' + topics.length + ' 題'; $('callHistory').textContent = callOrder.length ? '已點名：' + callOrder.join('、') : ''; selectTool([...toolDefs.map(t => t[0]), 'rollcall'].includes(s.tool) ? s.tool : 'timer'); renderTimer(); renderBoard(); revision = s.revision; dirty = false; }
function readSaved(key = STATE_KEY) { const raw = localStorage.getItem(key); if (!raw)
    return null; const s = JSON.parse(raw); if (!validLesson(s))
    throw Error('保存格式不完整'); return s; }
function freezeEditing() { conflict = true; running = false; $('conflict').hidden = false; $('saveStatus').textContent = '⚠ 此頁已停止寫入，請載入最新保存。'; }
function saveProject(force = false) { if (!booted || conflict)
    return false; dirty = true; if (!force && !input('autoSave').checked) {
    $('saveStatus').textContent = '尚未保存；請匯出課堂檔或開啟自動保存。';
    return false;
} try {
    const old = readSaved();
    if (old && old.revision !== revision) {
        freezeEditing();
        return false;
    }
    const s = snapshot();
    s.revision = crypto.randomUUID();
    if (!validLesson(s))
        throw Error('目前資料超出可保存範圍，請先匯出及檢查設定');
    const text = JSON.stringify(s);
    if (text.length > 1500000)
        throw Error('課堂資料過大，請減少內容並匯出備份');
    if (old)
        localStorage.setItem(BACKUP_KEY, JSON.stringify(old));
    localStorage.setItem(STATE_KEY, text);
    revision = s.revision;
    dirty = false;
    $('saveStatus').textContent = '✓ 已保存於本瀏覽器 · ' + new Date().toLocaleTimeString('zh-TW');
    return true;
}
catch (e) {
    $('saveStatus').textContent = '⚠ 保存失敗：' + (e instanceof Error ? e.message : '瀏覽器空間不足') + '。請立即匯出課堂檔。';
    return false;
} }
function queueSave() { if (!booted)
    return; dirty = true; window.clearTimeout(autosaveTimer); autosaveTimer = window.setTimeout(() => saveProject(), 250); }
function downloadText(name, text, type = 'text/plain;charset=utf-8') { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
function parseLesson(text) { if (text.length > 1500000)
    throw Error('課堂檔超過 1.5 MB'); const s = JSON.parse(text); if (!validLesson(s))
    throw Error('不是有效的 Co-Space 課堂檔，或內容已損壞'); return s; }
action('saveNow', () => { saveProject(true); });
action('exportLesson', () => { const s = snapshot(); if (!validLesson(s))
    throw Error('資料格式有誤，尚無法匯出'); downloadText('CoSpace-課堂備份.json', JSON.stringify(s, null, 2), 'application/json'); say('已匯出課堂檔，包含名單、分數與得獎紀錄，請私下保存。'); });
function onFile(id, fn) { input(id).addEventListener('change', async () => { try {
    if (conflict)
        throw Error('請先載入最新課堂');
    if (drawing)
        throw Error('請等抽獎揭曉後再匯入');
    const file = input(id).files?.[0];
    if (!file)
        return;
    if (file.size > 1500000)
        throw Error('檔案最多 1.5 MB');
    const text = await file.text();
    fn(text);
    queueSave();
}
catch (e) {
    say('匯入失敗：' + (e instanceof Error ? e.message : '檔案無法讀取'), true);
}
finally {
    input(id).value = '';
} }); }
onFile('importLesson', text => { const s = parseLesson(text); if (!window.confirm('匯入會取代目前課堂。建議先匯出目前資料，確定繼續？'))
    return; const old = readSaved(); applyLesson(s); revision = old?.revision || ''; saveProject(true); say('課堂檔已匯入；音樂檔需重新選取。'); });
onFile('importNames', text => { area('names').value = lines(text).join('\n'); selectTool('lottery'); $('roster').querySelector('details').open = true; say('名單已載入，請確認後按「套用名單」。'); });
onFile('importTopics', text => { area('topicList').value = lines(text).join('\n'); say('題目已載入，請按「套用題目」。'); });
onFile('importPrizes', text => { if (wins.length)
    throw Error('已有得獎結果，不能匯入取代獎品'); const list = lines(text).filter(t => t !== '獎品\t數量').map((l, i) => { const [name, count] = l.split('\t'); const qty = Number(count); if (!name || name.length > 80 || !Number.isInteger(qty) || qty < 1 || qty > 500)
    throw Error('第 ' + (i + 1) + ' 行格式需為「獎品名稱 Tab 數量」'); return { id: i + 1, name, qty }; }); if (list.length > 100)
    throw Error('最多 100 種獎品'); prizes = list; nextPrize = list.length + 1; renderPrizes(); say('已匯入 ' + list.length + ' 種獎品。'); });
action('templateNames', () => downloadText('名單範本.txt', '01 小明\n02 小美\n03 小華\n'));
action('templateTopics', () => downloadText('題目範本.txt', '今天最想學會什麼？\n分享一個工作上的小挑戰。\n'));
action('templatePrizes', () => downloadText('獎品範本.tsv', '獎品\t數量\n筆記本\t3\n體驗券\t1\n'));
action('restoreBackup', () => { const backup = readSaved(BACKUP_KEY); if (!backup)
    throw Error('尚無本機備份'); if (!window.confirm('用上一份備份取代目前課堂？請先匯出目前資料。'))
    return; const current = readSaved(); applyLesson(backup); revision = current?.revision || ''; saveProject(true); say('已恢復上一份本機備份。'); });
action('clearSaved', () => { if (!window.confirm('清除本機保存與備份？目前畫面仍保留，可先匯出課堂檔。'))
    return; localStorage.removeItem(STATE_KEY); localStorage.removeItem(BACKUP_KEY); localStorage.removeItem('cospace-classroom-roster-v1'); input('autoSave').checked = false; input('remember').checked = false; revision = ''; $('saveStatus').textContent = '本機保存已清除；目前僅留在頁面。'; });
action('newLesson', () => { if (!window.confirm('建立空白課堂前請先匯出備份。確定繼續？'))
    return; const fresh = { schema: 1, revision, title: '', names: [], prizes: [], wins: [], nextPrize: 1, teams: [], undo: [], groups: [], topics: [], pool: [], called: [], excluded: [], callOrder: [], controls: { names: '', remember: false, minutes: '5', seconds: '0', timerLabel: '', sound: true, alarmVolume: '70', captionSize: '48', prizeName: '', prizeQty: '1', repeatWinner: false, groupMode: 'count', groupCount: '3', boardText: '', boardSize: '48', boardTheme: 'dark', teamName: '', scoreStep: '1', topicList: '', youtube: '', musicLoop: false }, timer: { seconds: 300, initial: 300, deadline: 0, running: false }, output: { winner: '等待抽獎', topic: '先加入題目再抽取', called: '準備邀請分享' }, tool: 'timer' }; applyLesson(fresh); saveProject(true); say('已建立空白課堂，上一份內容仍在本機備份。'); });
action('reloadLatest', () => { const s = readSaved(); if (!s)
    throw Error('尚無最新保存'); conflict = false; $('conflict').hidden = true; applyLesson(s); $('saveStatus').textContent = '✓ 已載入最新課堂'; });
window.addEventListener('storage', e => { if (e.key === STATE_KEY && e.newValue) {
    try {
        const s = JSON.parse(e.newValue);
        if (s.revision !== revision)
            freezeEditing();
    }
    catch {
        freezeEditing();
    }
} });
document.querySelector('main').addEventListener('click', e => { if (conflict && !e.target.closest('#reloadLatest,#exportLesson')) {
    e.preventDefault();
    e.stopImmediatePropagation();
} }, true);
document.querySelector('main').addEventListener('input', e => { if (conflict) {
    e.preventDefault();
    e.stopImmediatePropagation();
} }, true);
document.addEventListener('click', e => { if (e.target.closest('button') && !['clearSaved', 'exportLesson', 'reloadLatest'].includes(e.target.id))
    queueSave(); });
document.addEventListener('input', queueSave);
document.addEventListener('change', queueSave);
document.addEventListener('visibilitychange', () => { if (document.hidden && dirty)
    saveProject(); });
window.addEventListener('pagehide', () => { if (dirty)
    saveProject(); });
// Audible alarm test, larger break notice, local music playlist, and explicit YouTube handoff.
action('soundTest', () => { void beep(true); });
input('captionSize').addEventListener('input', () => { renderTimer(); });
input('scoreStep').addEventListener('change', renderTeams);
document.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { input('scoreStep').value = b.dataset.step; renderTeams(); });
action('scoreDock', () => { selectTool('scores'); $('scores').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
action('legacyRollcall', () => selectTool('rollcall'));
action('openYoutube', () => { const url = youtubeURL(val('youtube')); const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click(); say('已開啟 YouTube；請在該頁按播放，播放清單依平台規則連播。'); });
let musicURLs = [];
let musicIndex = 0;
const player = $('musicPlayer');
input('musicFiles').addEventListener('change', () => { player.pause(); musicURLs.forEach(u => URL.revokeObjectURL(u)); const files = Array.from(input('musicFiles').files || []); if (files.length > 30) {
    say('一次最多 30 首音樂。', true);
    return;
} musicURLs = files.map(f => URL.createObjectURL(f)); const list = $('musicList'); list.replaceChildren(); files.forEach((f, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = f.name; list.append(o); }); musicIndex = 0; if (musicURLs[0])
    player.src = musicURLs[0]; say('音樂已選取，請按播放器的播放鍵。'); });
input('musicList').addEventListener('change', () => { musicIndex = Number(val('musicList')); player.src = musicURLs[musicIndex]; void player.play().catch(() => say('請按播放器播放鍵。', true)); });
player.addEventListener('ended', () => { if (musicIndex + 1 < musicURLs.length)
    musicIndex++;
else if (input('musicLoop').checked)
    musicIndex = 0;
else
    return; input('musicList').value = String(musicIndex); player.src = musicURLs[musicIndex]; void player.play().catch(() => say('連播被瀏覽器暫停，請按播放鍵。', true)); });
// Commit the result before animation so reloading cannot lose an already drawn winner.
let drawing = false;
let drawAnimation = 0;
let drawFinish = 0;
let pendingReveal = '';
function setDrawingLock(lock) { for (const id of ['drawPrize', 'resetLottery', 'applyNames', 'clearNames', 'addPrize'])
    $(id).disabled = lock; $('skipDraw').hidden = !lock; }
function updateLotteryGuide() { const p = prizes.find(p => wins.filter(w => w.prizeId === p.id).length < p.qty); const total = prizes.reduce((a, p) => a + p.qty, 0); $('lotteryNext').textContent = !names.length ? '① 先套用共用名單 → ② 加入獎品 → ③ 開始抽獎' : !prizes.length ? '② 加入獎品與數量，再開始抽獎' : p ? '已抽 ' + wins.length + '／' + total + ' 位。下一位獎品：' + p.name + '；請再按下方按鈕。' : '所有 ' + total + ' 位得獎者已抽完，可下載結果。'; $('drawPrize').textContent = p ? '抽下一位 · ' + p.name : '開始抽獎'; }
function finishDraw() { if (!drawing)
    return; clearInterval(drawAnimation); clearTimeout(drawFinish); $('winner').textContent = pendingReveal; drawing = false; setDrawingLock(false); updateLotteryGuide(); syncProject(); saveProject(); say('得獎者已揭曉；' + $('lotteryNext').textContent); }
function animateWinner(revealed) { pendingReveal = revealed; if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishDraw();
    return;
} $('winner').textContent = '抽獎中…'; drawAnimation = window.setInterval(() => { $('winner').textContent = names[randomInt(names.length)]; syncProject(); }, 85); drawFinish = window.setTimeout(finishDraw, 2200); }
action('skipDraw', finishDraw);
document.addEventListener('visibilitychange', () => { if (document.hidden && drawing)
    finishDraw(); });
function displaySnapshot() { const source = displaySource; const screen = $(source); const data = { type: 'display', source, title: val('lessonTitle') || 'Co-Space 課堂展示', text: screen.innerText }; if (source === 'timerScreen') {
    data.text = $('timerCaption').textContent || '';
    data.seconds = secondsLeft;
    data.deadline = deadline;
    data.running = running;
    data.size = Number(val('captionSize'));
}
else if (source === 'scoreScreen')
    data.teams = snapshotTeams();
else if (source === 'groupResults')
    data.groups = getGroups();
else if (source === 'boardScreen') {
    data.text = area('boardText').value;
    data.size = Number(val('boardSize'));
} return data; }
let frozenDisplay = null;
function sendDisplay() { try {
    const d = ['boardScreen', 'groupResults'].includes(displaySource) && frozenDisplay ? frozenDisplay : displaySnapshot();
    broadcast?.postMessage(d);
    if (displayWindow && !displayWindow.closed)
        displayWindow.postMessage(d, location.origin);
}
catch { /* display unavailable does not block saving */ } }
window.addEventListener('message', e => { if (e.origin === location.origin && e.source === displayWindow && e.data?.type === 'ready')
    sendDisplay(); });
action('openDisplay', () => { displayWindow = window.open('./display.html', 'cospace-student-display'); if (!displayWindow)
    say('請允許此網站開啟投影視窗。', true);
else
    say('投影窗已開啟；請拖到第二螢幕。老師留在本頁操作，設定不會傳到展示窗。'); });
for (const [id, label] of [['timerScreen', '倒數與公告'], ['lotteryScreen', '抽獎揭曉'], ['groupResults', '分組結果'], ['boardScreen', '課堂公告'], ['scoreScreen', '分組分數'], ['topicScreen', '抽出題目']]) {
    const host = $(id === 'groupResults' ? 'groups' : id === 'timerScreen' ? 'timer' : id === 'lotteryScreen' ? 'lottery' : id === 'boardScreen' ? 'board' : id === 'scoreScreen' ? 'scores' : 'topics');
    const b = document.createElement('button');
    b.textContent = '送到學生投影窗 · ' + label;
    b.className = 'send-display';
    b.onclick = () => { displaySource = id; frozenDisplay = displaySnapshot(); sendDisplay(); say('已選擇投影：' + label + '。尚未開窗時，請按上方「開啟學生投影窗」。'); };
    host.insertBefore(b, host.querySelector('.screen') || $(id));
}
// Do not publish live drafts until the instructor explicitly sends that tool.
try {
    const s = readSaved();
    if (s) {
        applyLesson(s);
        $('saveStatus').textContent = '✓ 已恢復上一堂課的保存（' + s.title + '）';
    }
    else
        $('saveStatus').textContent = '尚無課堂保存；操作後將自動保存在此瀏覽器。';
}
catch {
    try {
        const b = readSaved(BACKUP_KEY);
        if (b) {
            applyLesson(b);
            $('saveStatus').textContent = '⚠ 主保存無法讀取，已載入上一份備份。請先匯出課堂檔。';
            input('autoSave').checked = false;
        }
        else
            throw Error();
    }
    catch {
        $('saveStatus').textContent = '⚠ 無法讀取本機保存，請匯入課堂備份。';
        input('autoSave').checked = false;
    }
}
booted = true;
updateLotteryGuide();
