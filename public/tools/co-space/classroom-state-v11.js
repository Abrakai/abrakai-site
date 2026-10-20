function obj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
const str = (v, max = 20000) => typeof v === 'string' && v.length <= max;
const num = (v, max = 1e12) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max;
const arr = (v, max, test) => Array.isArray(v) && v.length <= max && v.every(test);
export function validLesson(v) {
    if (!obj(v) || v.schema !== 1 || !str(v.revision, 100) || !str(v.title, 120) || !str(v.tool, 30))
        return false;
    const team = (t) => obj(t) && str(t.name, 100) && num(t.score, 1e12) && Number.isSafeInteger(t.score);
    if (!arr(v.names, 500, x => str(x, 100)) || !arr(v.teams, 30, team) || !arr(v.undo, 100, x => arr(x, 30, team)))
        return false;
    const names = v.names;
    if (new Set(names).size !== names.length)
        return false;
    if (!arr(v.prizes, 100, p => obj(p) && Number.isInteger(p.id) && num(p.id, 1e6) && str(p.name, 80) && Number.isInteger(p.qty) && num(p.qty, 500) && Number(p.qty) > 0))
        return false;
    const prizes = v.prizes;
    if (new Set(prizes.map(p => p.id)).size !== prizes.length)
        return false;
    if (!arr(v.wins, 5000, w => obj(w) && Number.isInteger(w.person) && Number(w.person) >= 0 && Number(w.person) < names.length && w.name === names[Number(w.person)] && prizes.some(p => p.id === w.prizeId && p.name === w.prize) && str(w.time, 100)))
        return false;
    const wins = v.wins;
    if (new Set(wins.map(w => w.person + ':' + w.prizeId)).size !== wins.length || prizes.some(p => wins.filter(w => w.prizeId === p.id).length > p.qty))
        return false;
    if (!Number.isInteger(v.nextPrize) || !num(v.nextPrize, 1e6) || Number(v.nextPrize) <= Math.max(0, ...prizes.map(p => p.id)))
        return false;
    if (!arr(v.groups, 500, g => obj(g) && str(g.name, 100) && arr(g.members, 500, m => str(m, 100))))
        return false;
    if (!arr(v.topics, 500, t => str(t, 20000)) || !arr(v.pool, 500, t => str(t, 20000)))
        return false;
    for (const k of ['called', 'excluded'])
        if (!arr(v[k], 500, i => Number.isInteger(i) && Number(i) >= 0 && Number(i) < names.length))
            return false;
    if (!arr(v.callOrder, 500, n => str(n, 100)) || !obj(v.controls) || Object.keys(v.controls).length > 40 || !Object.values(v.controls).every(x => typeof x === 'boolean' || str(x)))
        return false;
    if (!obj(v.timer) || !num(v.timer.seconds, 10859) || Number(v.timer.seconds) < 0 || !num(v.timer.initial, 10859) || !num(v.timer.deadline, 1e14) || typeof v.timer.running !== 'boolean')
        return false;
    if (!obj(v.output) || !['winner', 'topic', 'called'].every(k => str(v.output[k])))
        return false;
    return true;
}
export function youtubeURL(s) { const u = new URL(s); if (u.protocol !== 'https:' || !['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com'].includes(u.hostname) || u.username || u.password)
    throw Error('請輸入 https 的 YouTube 影片或播放清單連結'); if (!['/watch', '/playlist'].includes(u.pathname) && u.hostname !== 'youtu.be')
    throw Error('請貼上影片或播放清單的完整連結'); return u.href; }
