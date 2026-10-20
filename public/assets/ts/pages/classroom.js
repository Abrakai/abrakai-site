import { renderMiniMeGallery } from '../components/miniMe.js';
import { qs } from '../lib/dom.js';
const year = qs('#year');
if (year)
    year.textContent = String(new Date().getFullYear());
const preview = qs('#mini-me-preview');
if (preview)
    renderMiniMeGallery(preview, true);
const previewDuplicate = qs('#mini-me-preview-duplicate');
if (previewDuplicate)
    renderMiniMeGallery(previewDuplicate, true);
