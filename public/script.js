(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  const year = document.querySelector('#year');
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('#form-status');

  if (year) year.textContent = new Date().getFullYear();

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? '關閉導覽選單' : '開啟導覽選單');
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  });

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('visible'));
  }

  const showStatus = (message, type) => {
    if (!status) return;
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
    const phone = String(data.get('phone') || '').trim();
    const email = String(data.get('email') || '').trim();

    if (!phone && !email) {
      showStatus('聯絡電話與電子郵件請至少填寫一項。', 'error');
      return;
    }

    const subject = `【阿布拉.凱 工作室網站】${data.get('service')}－${data.get('name')}`;
    const body = [
      `姓名／稱呼：${data.get('name')}`,
      `公司或單位：${data.get('company') || '未填寫'}`,
      `聯絡電話：${phone || '未填寫'}`,
      `電子郵件：${email || '未填寫'}`,
      `想了解的服務：${data.get('service')}`,
      '',
      '需求說明：',
      data.get('message')
    ].join('\n');

    showStatus('已整理好需求內容，正在開啟 Email 草稿。請確認後寄出。', 'success');
    window.location.href = `mailto:abrakai.99@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
