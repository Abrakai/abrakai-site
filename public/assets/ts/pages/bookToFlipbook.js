import { qs, qsa } from '../lib/dom.js';
const year = qs('#year');
if (year)
    year.textContent = String(new Date().getFullYear());
const status = qs('#copy-status');
const copyButtons = qsa('[data-copy-target]');
// 教材步驟網址與課堂導覽卡可直接展開對應內容。
const setLessonHeaderOffset = () => {
    const header = qs('.ak-site-shell');
    document.documentElement.style.setProperty('--lesson-header-offset', `${(header?.getBoundingClientRect().height ?? 76) + 16}px`);
};
const openLinkedStep = (hash) => {
    if (!/^#step-[1-6]$/.test(hash))
        return;
    const step = document.getElementById(hash.slice(1));
    if (!(step instanceof HTMLDetailsElement))
        return;
    step.open = true;
    setLessonHeaderOffset();
    window.requestAnimationFrame(() => step.scrollIntoView({ block: 'start', behavior: 'instant' }));
};
setLessonHeaderOffset();
openLinkedStep(window.location.hash);
window.addEventListener('hashchange', () => openLinkedStep(window.location.hash));
window.addEventListener('resize', setLessonHeaderOffset);
qsa('a[href^="#step-"]').forEach((link) => {
    link.addEventListener('click', () => openLinkedStep(link.hash));
});
const announce = (message) => {
    if (!status)
        return;
    status.textContent = message;
};
const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let ok = false;
    try {
        ok = document.execCommand('copy');
    }
    catch {
        ok = false;
    }
    textarea.remove();
    return ok;
};
const copyText = async (text) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        }
        catch {
            return fallbackCopy(text);
        }
    }
    return fallbackCopy(text);
};
copyButtons.forEach((button) => {
    button.addEventListener('click', async () => {
        const targetId = button.dataset.copyTarget;
        if (!targetId)
            return;
        const target = document.getElementById(targetId);
        const prompt = target?.textContent?.trim();
        if (!prompt)
            return;
        const originalLabel = button.textContent ?? '複製 Prompt';
        const ok = await copyText(prompt);
        if (ok) {
            button.textContent = '已複製 ✓';
            button.classList.add('is-copied');
            announce(`${originalLabel}已複製，可直接貼到 AI 對話中。`);
            window.setTimeout(() => {
                button.textContent = originalLabel;
                button.classList.remove('is-copied');
            }, 1800);
        }
        else {
            announce('目前瀏覽器沒有允許自動複製，請長按提示詞文字後選擇「全選 → 複製」。');
        }
    });
});
