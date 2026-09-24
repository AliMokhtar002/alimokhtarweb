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
      <p>إدارة الأعمال المنشورة وإضافة مشروع جديد.</p>
      <form class="admin-login-form">
        <label>كلمة المرور<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="primary-button" type="submit">دخول <span>↗</span></button>
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
    bindWorkForm(dialog, password);
    loginView.hidden = true;
    panelView.hidden = false;
  };
  dialog.showModal();
}

function bindWorkForm(dialog, password) {
  const form = dialog.querySelector('.admin-work-form');
  const status = form.querySelector('.admin-status');
  const loginView = dialog.querySelector('.admin-login-view');
  const panelView = dialog.querySelector('.admin-panel-view');
  const loginForm = dialog.querySelector('.admin-login-form');
  form.reset();
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const file = data.get('image');
    if (!file || !file.type.startsWith('image/') || file.size > 3 * 1024 * 1024) {
      status.textContent = 'اختر صورة صحيحة أقل من 3MB.';
      return;
    }
    status.textContent = 'جاري النشر...';
    try {
      const imageUrl = await prepareImage(file);
      const response = await fetch('/.netlify/functions/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ type: 'post', title: data.get('title'), description: data.get('description'), imageUrl })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        status.textContent = result.error || `تعذر نشر العمل (${response.status}).`;
        if (response.status === 401) {
          panelView.hidden = true;
          loginView.hidden = false;
          loginForm.querySelector('input').focus();
        }
        return;
      }
      status.textContent = 'تم نشر العمل بنجاح.';
      form.reset();
    } catch (error) {
      status.textContent = 'تعذر الاتصال بخدمة النشر. تحقق من اتصالك وحاول مرة أخرى.';
    }
  };
}

function prepareImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}