import { qs } from '../lib/dom.js';
const header = qs('.site-header');
const year = qs('#year');
const form = qs('#contact-form');
const status = qs('#form-status');
if (year)
    year.textContent = String(new Date().getFullYear());
const updateHeader = () => { header?.classList.toggle('scrolled', window.scrollY > 20); };
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });
const showStatus = (message, type) => {
    if (!status)
        return;
    status.textContent = message;
    status.className = `form-status show ${type}`;
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
        form.reportValidity();
        showStatus('請先完成所有必填欄位。', 'error');
        return;
    }
    const data = new FormData(form);
    const phone = String(data.get('phone') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    if (!phone && !email) {
        showStatus('聯絡電話與電子郵件請至少填寫一項。', 'error');
        return;
    }
    const subject = `【阿布拉.凱 工作室網站】${String(data.get('service') ?? '')}－${String(data.get('name') ?? '')}`;
    const body = [
        `姓名／稱呼：${String(data.get('name') ?? '')}`,
        `公司或單位：${String(data.get('company') || '未填寫')}`,
        `聯絡電話：${phone || '未填寫'}`,
        `電子郵件：${email || '未填寫'}`,
        `想了解的服務：${String(data.get('service') ?? '')}`,
        '', '需求說明：', String(data.get('message') ?? ''),
    ].join('\n');
    const preview = qs('#contact-draft-text');
    const emailLink = qs('#contact-open-email');
    const draft = qs('#contact-draft');
    if (!preview || !emailLink || !draft)
        return;
    preview.value = `${subject}\n\n${body}`;
    emailLink.href = `mailto:abrakai.99@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    draft.hidden = false;
    showStatus('需求已整理，尚未寄出。請選擇下方聯絡方式，完成寄送。', 'success');
    draft.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
qs('#contact-copy-draft')?.addEventListener('click', async () => {
    const preview = qs('#contact-draft-text');
    if (!preview)
        return;
    try {
        await navigator.clipboard.writeText(preview.value);
        showStatus('已複製需求。請到工作室官方 LINE 或您的 Email 貼上並送出。', 'success');
    }
    catch {
        preview.focus();
        preview.select();
        showStatus('瀏覽器未允許自動複製，已選取內容。請長按複製或按 Ctrl／Command＋C。', 'error');
    }
});
form?.addEventListener('input', () => {
    const draft = qs('#contact-draft');
    if (draft && !draft.hidden) {
        draft.hidden = true;
        showStatus('資料已修改，請重新整理需求後再寄送。', 'success');
    }
});
const lesson = qs('#featured-book-to-flipbook-lesson');
if (lesson) {
    lesson.innerHTML = `
    <div class="home-mini-me-copy">
      <span class="home-mini-me-badge">AI 小教室・實作教學</span>
      <h3>一本書，變成會翻頁的網站</h3>
      <p>用六段 Prompt 完成素材盤點、書刊重點整理、八頁導讀、單一 HTML、互動升級與發布檢查。內含 65 分鐘教學流程（可調整為 60～70 分鐘），以及《孫子兵法》互動範例。</p>
      <div class="home-mini-me-actions">
        <a class="btn btn-primary" href="/classroom/book-to-flipbook/">看完整課程</a>
        <a class="home-mini-me-link" href="/classroom/book-to-flipbook/demo/">玩翻頁範例 →</a>
        <a class="home-mini-me-link" href="/classroom/">進入 AI 小教室 →</a>
        <a class="home-mini-me-link" href="/tools/co-space/">Co-Space 課堂工具 →</a>
      </div>
    </div>
    <div class="home-book-lab" aria-label="書刊經 AI 轉為互動網站的流程示意">
      <span class="home-book-lab__status">AI PUBLISHING LAB / READY</span>
      <div class="home-book-lab__flow">
        <div><small>01 / INPUT</small><strong>書刊</strong><span>封面・目錄・內頁</span></div>
        <b aria-hidden="true">→</b>
        <div><small>03 / OUTPUT</small><strong>翻頁網站</strong><span>滑鼠・鍵盤・手機</span></div>
      </div>
    </div>
  `;
}
