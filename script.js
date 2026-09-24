const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const visitCount = document.querySelector('[data-visit-count]');
const contentUrl = '/.netlify/functions/content';

if (visitCount) {
  const storedCount = Number.parseInt(localStorage.getItem('ali-mokhtar-visits') || '1220', 10);
  const nextCount = Number.isNaN(storedCount) ? 1221 : storedCount + 1;
  localStorage.setItem('ali-mokhtar-visits', String(nextCount));
  visitCount.textContent = String(nextCount);
}

fetch(contentUrl)
  .then((response) => response.ok ? response.json() : null)
  .then((content) => {
    if (!content) return;
    const banner = document.querySelector('[data-news-banner]');
    const message = document.querySelector('[data-news-message]');
    if (content.news && banner && message) {
      message.textContent = content.news.message;
      banner.hidden = false;
      window.setTimeout(() => { banner.hidden = true; }, Math.max(0, content.news.expiresAt - Date.now()));
    }
  })
  .catch(() => {});

if (!sessionStorage.getItem('site-visit-recorded')) {
  sessionStorage.setItem('site-visit-recorded', '1');
  fetch('/.netlify/functions/visit', { method: 'POST', keepalive: true }).catch(() => {});
}

menuToggle?.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

document.querySelector('[data-news-close]')?.addEventListener('click', () => {
  document.querySelector('[data-news-banner]').hidden = true;
});

const worksGrid = document.querySelector('[data-works-grid]');
if (worksGrid) {
  fetch(contentUrl)
    .then((response) => response.ok ? response.json() : null)
    .then((content) => {
      content?.works?.slice().reverse().forEach((work) => {
        const card = document.createElement('figure');
        card.className = 'work-card dynamic-work';
        card.innerHTML = `<img src="${escapeAttribute(work.imageUrl)}" alt=""><figcaption></figcaption>`;
        card.querySelector('figcaption').textContent = work.title;
        worksGrid.prepend(card);
      });
    })
    .catch(() => {});
}

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
