let currentLang = localStorage.getItem('jsha_lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('jsha_lang', lang);
  document.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
  document.querySelectorAll('.lang-kz').forEach(el => el.style.display = lang === 'kz' ? '' : 'none');
  document.querySelectorAll('.lang-btn-text').forEach(el => el.textContent = lang.toUpperCase());
}
function toggleLang() { setLanguage(currentLang === 'en' ? 'kz' : 'en'); }

let currentTheme = localStorage.getItem('jsha_theme') || 'dark';
function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('jsha_theme', theme);
  document.body.classList.toggle('light-theme', theme === 'light');
  document.querySelectorAll('.theme-icon').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}
function toggleTheme() { setTheme(currentTheme === 'dark' ? 'light' : 'dark'); }

function getUser() {
  return JSON.parse(localStorage.getItem('jsha_user') || 'null');
}
function updateAuthUI() {
  const user = getUser();
  document.querySelectorAll('.auth-link').forEach(el => {
    if (user) {
      el.textContent = user.name.split(' ')[0];
      el.href = '/courses';
      el.classList.remove('btn-login');
      el.style.color = 'var(--gold)';
      el.style.fontWeight = '600';
    }
  });
  document.querySelectorAll('.logout-link').forEach(el => {
    el.style.display = user ? '' : 'none';
  });
}
function logout() {
  localStorage.removeItem('jsha_user');
  showToast(currentLang === 'kz' ? 'Сіз шықтыңыз' : 'Logged out', 'info');
  setTimeout(() => window.location.href = '/', 800);
}
function toggleMenu() {
  document.querySelector('.nav-links')?.classList.toggle('open');
}
 
function initPage() {
  setTheme(currentTheme);
  setLanguage(currentLang);
  updateAuthUI();
  initScrollToTop();
  initSpinnerHide();
  loadProgress();
}
 
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      display:flex; flex-direction:column; gap:8px; pointer-events:none;
    `;
    document.body.appendChild(container);
  }

  const colors = {
    success: '#10b981',
    error:   '#ef4444',
    info:    '#8b5cf6',
    warning: '#f59e0b'
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:var(--bg-card);
    border:1px solid ${colors[type] || colors.info};
    color:var(--text);
    padding:12px 20px;
    border-radius:10px;
    font-size:14px;
    font-family:var(--font-body);
    box-shadow:0 4px 20px rgba(0,0,0,0.3);
    opacity:0;
    transform:translateX(40px);
    transition:all 0.3s;
    pointer-events:auto;
    min-width:220px;
    display:flex; align-items:center; gap:10px;
  `;
  const icons = { success: '✅', error: '❌', info: '⚡', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || '⚡'}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
 
function initScrollToTop() {
  const existing = document.getElementById('scrollTopBtn');
  if (!existing) {
    const btn = document.createElement('button');
    btn.id = 'scrollTopBtn';
    btn.innerHTML = '▲';
    btn.title = 'Жоғарыға';
    btn.style.cssText = `
      position:fixed; bottom:80px; right:24px;
      width:42px; height:42px;
      background:var(--accent); color:#fff;
      border:none; border-radius:50%;
      font-size:16px; cursor:pointer;
      display:none; align-items:center; justify-content:center;
      z-index:999; box-shadow:0 4px 16px var(--accent-glow);
      transition:all 0.3s;
    `;
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);
  }

  window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    if (window.scrollY > 300) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });
}
 
function showSpinner() {
  let overlay = document.getElementById('spinnerOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'spinnerOverlay';
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.5);
      z-index:8888; display:flex; align-items:center; justify-content:center;
    `;
    overlay.innerHTML = `
      <div style="
        width:48px; height:48px;
        border:4px solid var(--border-solid);
        border-top-color:var(--accent);
        border-radius:50%;
        animation:spin 0.8s linear infinite;
      "></div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function hideSpinner() {
  const overlay = document.getElementById('spinnerOverlay');
  if (overlay) overlay.style.display = 'none';
}

function initSpinnerHide() {
  // Барлық fetch сұраныстарда spinner автоматты шығу
  window.addEventListener('load', hideSpinner);
}
 
function openModal(title, bodyHTML) {
  let overlay = document.getElementById('globalModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'globalModal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 id="modalTitle" style="font-family:var(--font-display);font-size:24px;letter-spacing:2px;"></h3>
          <button onclick="closeModal()" style="
            background:none;border:none;color:var(--text-secondary);
            font-size:22px;cursor:pointer;line-height:1;
          ">✕</button>
        </div>
        <div id="modalBody"></div>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
  }
  document.getElementById('modalTitle').innerHTML = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('globalModal');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ESC — модалды жабу
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
 
const PROGRESS_KEY = 'jsha_progress';

function saveProgress(data) {
  const current = getProgress();
  const updated = { ...current, ...data, updatedAt: Date.now() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
}

function getProgress() {
  return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
}

function loadProgress() {
  const p = getProgress();
  // Progress bar UI бар болса, жаңарту
  const bar = document.getElementById('progressBarFill');
  if (bar && p.percent !== undefined) {
    bar.style.width = p.percent + '%';
  }
  return p;
}
 
const LIKES_KEY = 'jsha_likes';

function getLikes() {
  return JSON.parse(localStorage.getItem(LIKES_KEY) || '[]');
}

function toggleLike(courseId) {
  const likes = getLikes();
  const idx = likes.indexOf(courseId);
  if (idx === -1) {
    likes.push(courseId);
    showToast(currentLang === 'kz' ? 'Таңдаулыларға қосылды ❤️' : 'Added to favorites ❤️', 'success');
  } else {
    likes.splice(idx, 1);
    showToast(currentLang === 'kz' ? 'Таңдаулылардан алынды' : 'Removed from favorites', 'info');
  }
  localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  updateLikeButtons();
  return likes.includes(courseId);
}

function isLiked(courseId) {
  return getLikes().includes(courseId);
}

function updateLikeButtons() {
  document.querySelectorAll('[data-like-id]').forEach(btn => {
    const id = parseInt(btn.dataset.likeId);
    btn.classList.toggle('liked', isLiked(id));
    btn.innerHTML = isLiked(id) ? '❤️' : '🤍';
  });
}
 
function getHeader(activePage) {
  return `
  <header>
    <div class="header-inner">
      <a href="/" class="logo">
        <div class="logo-icon">JS</div>
        <span class="logo-text">HEROES <span>ACADEMY</span></span>
      </a>
      <div class="hamburger" onclick="toggleMenu()">
        <span></span><span></span><span></span>
      </div>
      <nav>
        <div class="nav-links">
          <a href="/" class="${activePage==='home'?'active':''}">HOME</a>
          <a href="/courses" class="${activePage==='courses'?'active':''}">COURSES</a>
          <a href="/quiz" class="${activePage==='quiz'?'active':''}">QUIZ</a>
          <a href="/contact" class="${activePage==='contact'?'active':''}">CONTACT</a>
          <a href="/login" class="btn-login auth-link">LOGIN</a>
          <a href="#" class="logout-link" onclick="logout()" style="display:none;color:var(--text-muted);font-size:12px;">
            <span class="lang-en">Logout</span><span class="lang-kz">Шығу</span>
          </a>
        </div>
        <div class="header-controls">
          <button class="ctrl-btn lang-btn" onclick="toggleLang()"><span class="lang-btn-text">EN</span></button>
          <button class="ctrl-btn" onclick="toggleTheme()"><span class="theme-icon">☀️</span></button>
        </div>
      </nav>
    </div>
  </header>`;
}

function getFooter() {
  return `
  <footer>
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo">
            <div class="logo-icon">JS</div>
            <span class="logo-text">HEROES <span>ACADEMY</span></span>
          </div>
          <p>
            <span class="lang-en">Marvel-style interactive JavaScript learning platform in Kazakh and English.</span>
            <span class="lang-kz">Marvel стиліндегі интерактивті JavaScript оқыту платформасы.</span>
          </p>
        </div>
        <div class="footer-col">
          <h4><span class="lang-en">Navigation</span><span class="lang-kz">Навигация</span></h4>
          <ul>
            <li><a href="/"><span class="lang-en">Home</span><span class="lang-kz">Басты бет</span></a></li>
            <li><a href="/courses"><span class="lang-en">Courses</span><span class="lang-kz">Курстар</span></a></li>
            <li><a href="/quiz"><span class="lang-en">Quiz</span><span class="lang-kz">Тест</span></a></li>
            <li><a href="/contact"><span class="lang-en">Contact</span><span class="lang-kz">Байланыс</span></a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4><span class="lang-en">Account</span><span class="lang-kz">Аккаунт</span></h4>
          <ul>
            <li><a href="/login"><span class="lang-en">Login</span><span class="lang-kz">Кіру</span></a></li>
            <li><a href="/register"><span class="lang-en">Register</span><span class="lang-kz">Тіркелу</span></a></li>
            <li><a href="/admin"><span class="lang-en">Admin</span><span class="lang-kz">Админ</span></a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4><span class="lang-en">Contact</span><span class="lang-kz">Байланыс</span></h4>
          <ul>
            <li><a href="mailto:info@jsha.kz">info@jsha.kz</a></li>
            <li><a href="tel:+77001234567">+7 700 123 45 67</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">© 2026 JS Heroes Academy.</div>
    </div>
  </footer>`;
} 
function createCourseCardHorizontal(c) {
  const lang = currentLang;
  const title = lang === 'kz' ? c.kz.title : c.en.title;
  const desc  = lang === 'kz' ? c.kz.desc  : c.en.desc;
  const liked = isLiked(c.id);
  return `
    <a href="/course/${c.id}" class="course-card">
      <div class="card-thumb">
        <img src="${c.img}" alt="${title}" loading="lazy">
        <div class="play-overlay">
          <div class="play-icon">▶</div>
          <span class="play-label">Video Preview</span>
        </div>
      </div>
      <div class="card-content">
        <div class="card-tags">
          <span class="tag tag-${c.heroType}">${c.heroType.toUpperCase()}</span>
          <span class="tag tag-${c.category}">✦ ${c.category.toUpperCase()}</span>
        </div>
        <h3>${title}</h3>
        <p>${desc}</p>
      </div>
      <div class="card-action">
        <button class="enroll-btn" onclick="event.preventDefault(); showToast('${lang==='kz'?'Курсқа жазылдыңыз!':'Enrolled successfully!'}','success');">ENROLL ✦</button>
        <button
          data-like-id="${c.id}"
          onclick="event.preventDefault(); toggleLike(${c.id});"
          style="background:none;border:none;font-size:20px;cursor:pointer;padding:4px;"
          title="Favorite"
        >${liked ? '❤️' : '🤍'}</button>
        <span class="status-badge">STATUS: <span>ACTIVE</span></span>
      </div>
    </a>`;
}

function createCourseCardVertical(c) {
  const lang = currentLang;
  const title = lang === 'kz' ? c.kz.title : c.en.title;
  const desc  = lang === 'kz' ? c.kz.desc  : c.en.desc;
  const liked = isLiked(c.id);
  return `
    <a href="/course/${c.id}" class="v-card">
      <img class="v-card-img" src="${c.img}" alt="${title}" loading="lazy">
      <div class="v-card-body">
        <div class="card-tags" style="margin-bottom:8px;">
          <span class="tag tag-${c.heroType}">${c.heroType.toUpperCase()}</span>
          <span class="tag tag-${c.category}">✦ ${c.category.toUpperCase()}</span>
        </div>
        <h3>${title}</h3>
        <p>${desc}</p>
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
          <button class="btn btn-primary btn-sm" onclick="event.preventDefault(); showToast('${lang==='kz'?'Курсқа жазылдыңыз!':'Enrolled!'}','success');">
            <span class="lang-en">View Course</span><span class="lang-kz">Курсты көру</span> →
          </button>
          <button
            data-like-id="${c.id}"
            onclick="event.preventDefault(); toggleLike(${c.id});"
            style="background:none;border:none;font-size:20px;cursor:pointer;"
            title="Favorite"
          >${liked ? '❤️' : '🤍'}</button>
        </div>
      </div>
    </a>`;
}
