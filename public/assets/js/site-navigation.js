/* V2.7.7: enhance the same static navigation on every content page. */
(() => {
  'use strict';
  const header = document.querySelector('.ak-site-shell');
  const button = header?.querySelector('.ak-menu-toggle');
  const nav = header?.querySelector('.ak-site-nav');
  if (!header || !button || !nav) return;
  const path = location.pathname;
  const routeKey = value => value.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const sameRoute = href => routeKey(path) === routeKey(href);
  const groups = [
    ['/classroom/', 'AI 小教室', [['課程總覽','/classroom/'],['書籍轉網站','/classroom/book-to-flipbook/'],['Mini Me','/classroom/mini-me/'],['奇幻角色創作','/classroom/fantasy-creation'],['思緒整理','/classroom/ai-thinking.html'],['決策思考','/classroom/ai-decision.html']]],
    ['/tools/', '工具中心', [['工具總覽','/tools/'],['Co-Space','/tools/co-space/']]],
    ['/products/', '產品介紹', [['產品總覽','/products/']]],
    ['/works/', '作品案例', [['作品總覽','/works/'],['股市小幫手','/works/abrakai-stock-helper/'],['孫子兵法','/classroom/book-to-flipbook/demo/']]],
    ['/real-estate/', '房產專區', [['房產專區','/real-estate/'],['房產安心查','/real-estate/property-tools/'],['房產稅務專題','/real-estate/gift-tax-planning/']]]
  ];
  const group = path.startsWith('/tools/line-sticker-guide/') ? groups[0] : groups.find(([prefix]) => path.startsWith(prefix));
  nav.querySelectorAll('a').forEach(a => {
    if (a.getAttribute('href') === '/#products') a.href = '/products/';
    if (a.getAttribute('href') === '/#works') a.href = '/works/';
    if (['/#real-estate','#real-estate'].includes(a.getAttribute('href'))) a.href = '/real-estate/';
  });
  if (group) {
    const trail = document.createElement('nav');
    trail.className = 'ak-context-navigation';
    trail.setAttribute('aria-label', '分類與返回導覽');
    const links = [['首頁','/'], ...group[2]];
    links.forEach(([label,href]) => {
      const a = document.createElement('a'); a.textContent = label; a.href = href;
      if (sameRoute(href)) a.setAttribute('aria-current','page');
      trail.append(a);
    });
    header.after(trail);
    if (!group[2].some(([,href]) => sameRoute(href))) {
      const current = document.createElement('span'); current.className='ak-context-current';
      current.textContent=document.querySelector('main h1')?.textContent.trim() || document.title.split('｜')[0];
      current.setAttribute('aria-current','page'); trail.append(current);
    }
    const sections = [...document.querySelectorAll('main section[id]')].filter(section => section.querySelector('h2'));
    if (sections.length > 1) {
      const label = document.createElement('label'); label.textContent = '本頁章節 ';
      const select = document.createElement('select'); select.setAttribute('aria-label','跳至本頁章節');
      const start = document.createElement('option'); start.textContent='選擇章節'; start.value=''; select.append(start);
      sections.forEach(section => {const option=document.createElement('option');option.value=section.id;option.textContent=section.querySelector('h2').textContent.trim();select.append(option);});
      select.addEventListener('change',()=>{if(select.value){const section=document.getElementById(select.value);section.scrollIntoView({block:'start'});history.replaceState(null,'',`#${select.value}`);}});
      label.append(select); trail.append(label);
    }
    const syncHeight = () => document.documentElement.style.setProperty('--ak-header-height', `${header.getBoundingClientRect().height}px`);
    new ResizeObserver(syncHeight).observe(header); syncHeight();
  }
  const setOpen = (open) => {
    header.classList.toggle('ak-nav-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('ak-nav-open')) {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !header.contains(event.target)) setOpen(false);
  });
  window.matchMedia('(max-width: 1120px)').addEventListener('change', () => setOpen(false));
  header.classList.add('ak-nav-ready');
})();
