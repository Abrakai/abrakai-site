import { miniMePoses } from '../data/miniMeLesson.js';
import { escapeHtml } from '../lib/dom.js';
export function renderMiniMeGallery(container, compact = false) {
    container.innerHTML = miniMePoses.map((pose) => `
    <figure class="${compact ? 'mini-thumb' : 'mini-example'}">
      <img src="${pose.image}" alt="${escapeHtml(pose.alt)}" loading="lazy">
      <figcaption><b>${pose.id}</b><span><strong>${escapeHtml(pose.title)}</strong>${compact ? '' : `<small>${escapeHtml(pose.description)}</small>`}</span></figcaption>
    </figure>
  `).join('');
}
export function renderCommandGrid(container) {
    container.innerHTML = miniMePoses.map((pose) => `
    <div class="command-card"><b>${pose.id}</b><span>${escapeHtml(pose.shortTitle)}</span></div>
  `).join('');
}
