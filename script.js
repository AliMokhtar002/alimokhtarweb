const contentUrl = '/.netlify/functions/content';
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const visitCount = document.querySelector('[data-visit-count]');

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
    mainNav?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
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
        const caption = card.querySelector('figcaption');
        caption.textContent = work.title;
        if (work.description) {
          const description = document.createElement('small');
          description.textContent = work.description;
          caption.append(description);
        }
        worksGrid.prepend(card);
      });
    })
    .catch(() => {});
}

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

const adminLink = document.createElement('a');
adminLink.href = '#admin';
adminLink.textContent = 'Just Admin';
adminLink.className = 'admin-link';
adminLink.addEventListener('click', (event) => {
  event.preventDefault();
  openAdminLogin();
});
document.querySelector('.main-nav')?.append(adminLink);

function createAdminDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'admin-dialog';
  dialog.innerHTML = `
    <button class="admin-close" type="button" aria-label="Close">×</button>
    <div class="admin-login-view">
      <span class="section-kicker">ADMIN ACCESS</span>
      <h2>Just Admin</h2>
      <p>\u0623\u062f\u062e\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0644\u062a\u062d\u0643\u0645 \u0641\u064a \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0639\u0645\u0627\u0644.</p>
      <form class="admin-login-form">
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="primary-button" type="submit">\u062f\u062e\u0648\u0644 <span>↗</span></button>
        <p class="admin-status" role="status"></p>
      </form>
    </div>
    <div class="admin-panel-view" hidden>
      <span class="section-kicker">WORKS CONTROL</span>
      <h2>\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u0644 \u062c\u062f\u064a\u062f</h2>
      <form class="admin-work-form">
        <label>\u0627\u0633\u0645 \u0627\u0644\u0635\u0648\u0631\u0629<input name="title" maxlength="120" required></label>
        <label>\u0627\u0644\u0648\u0635\u0641<textarea name="description" maxlength="500" rows="3"></textarea></label>
        <label>\u0627\u0644\u0635\u0648\u0631\u0629<input name="image" type="file" accept="image/*" required></label>
        <button class="primary-button" type="submit">\u0646\u0634\u0631 \u0627\u0644\u0639\u0645\u0644 <span>↗</span></button>
        <p class="admin-status" role="status"></p>
      </form>
    </div>`;
  document.body.append(dialog);
  dialog.querySelector('.admin-close').addEventListener('click', () => dialog.close());
  return dialog;
}

function openAdminLogin() {
  const dialog = document.querySelector('.admin-dialog') || createAdminDialog();
  const loginView = dialog.querySelector('.admin-login-view');
  const panelView = dialog.querySelector('.admin-panel-view');
  const loginForm = dialog.querySelector('.admin-login-form');
  loginView.hidden = false;
  panelView.hidden = true;
  loginForm.reset();
  loginForm.querySelector('.admin-status').textContent = '';
  loginForm.onsubmit = (event) => {
    event.preventDefault();
    const password = new FormData(loginForm).get('password');
    loginView.hidden = true;
    panelView.hidden = false;
    bindWorkForm(dialog, password);
  };
  dialog.showModal();
}

function bindWorkForm(dialog, password) {
  const form = dialog.querySelector('.admin-work-form');
  const status = form.querySelector('.admin-status');
  form.reset();
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const file = data.get('image');
    if (!file || file.size > 4 * 1024 * 1024) {
      status.textContent = '\u0627\u062e\u062a\u0631 \u0635\u0648\u0631\u0629 \u0623\u0642\u0644 \u0645\u0646 4MB.';
      return;
    }
    status.textContent = '\u062c\u0627\u0631\u064a \u0627\u0644\u0646\u0634\u0631...';
    const imageUrl = await readImage(file);
    const response = await fetch('/.netlify/functions/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ type: 'post', title: data.get('title'), description: data.get('description'), imageUrl })
    });
    if (!response.ok) {
      status.textContent = response.status === 401 ? '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.' : '\u062a\u0639\u0630\u0631 \u0646\u0634\u0631 \u0627\u0644\u0639\u0645\u0644.';
      return;
    }
    status.textContent = '\u062a\u0645 \u0646\u0634\u0631 \u0627\u0644\u0639\u0645\u0644 \u0628\u0646\u062c\u0627\u062d.';
    form.reset();
  };
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}