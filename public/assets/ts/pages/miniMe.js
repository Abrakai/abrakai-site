import { miniMePrompt, miniMeUseCases } from '../data/miniMeLesson.js';
import { renderCommandGrid, renderMiniMeGallery } from '../components/miniMe.js';
import { qs, escapeHtml } from '../lib/dom.js';
const examples = qs('#examples-grid');
if (examples)
    renderMiniMeGallery(examples);
const commands = qs('#command-grid');
if (commands)
    renderCommandGrid(commands);
const useCases = qs('#use-grid');
if (useCases) {
    useCases.innerHTML = miniMeUseCases.map((item, index) => `
    <article><span>${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></article>
  `).join('');
}
const promptText = qs('#promptText');
if (promptText)
    promptText.value = miniMePrompt;
const copyButton = qs('#copyPrompt');
const copyStatus = qs('#copyStatus');
copyButton?.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(miniMePrompt);
        if (copyStatus)
            copyStatus.textContent = '已複製完整提示詞，可以直接貼到新的 AI 對話。';
        copyButton.textContent = '已複製 ✓';
        window.setTimeout(() => { copyButton.textContent = '複製完整提示詞'; }, 1800);
    }
    catch {
        promptText?.select();
        document.execCommand('copy');
        if (copyStatus)
            copyStatus.textContent = '已選取並嘗試複製提示詞。';
    }
});
