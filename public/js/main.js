let currentLang = localStorage.getItem('jsha_lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('jsha_lang', lang);
  document.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
  document.querySelectorAll('.lang-kz').forEach(el => el.style.display = lang === 'kz' ? '' : 'none');
  document.querySelectorAll('.lang-btn-text').forEach(el => el.textContent = lang.toUpperCase());
}

function toggleLang() {
  setLanguage(currentLang === 'en' ? 'kz' : 'en');
}
 
let currentTheme = localStorage.getItem('jsha_theme') || 'dark';

function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('jsha_theme', theme);
  document.body.classList.toggle('light-theme', theme === 'light');
  document.querySelectorAll('.theme-icon').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}

function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}
 
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
  window.location.href = '/';
}
 
function toggleMenu() {
  document.querySelector('.nav-links')?.classList.toggle('open');
}
 
function initPage() {
  setTheme(currentTheme);
  setLanguage(currentLang);
  updateAuthUI();
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
  const desc = lang === 'kz' ? c.kz.desc : c.en.desc;
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
        <button class="enroll-btn" onclick="event.preventDefault();">ENROLL ✦</button>
        <span class="status-badge">STATUS: <span>ACTIVE</span></span>
      </div>
    </a>`;
}

function createCourseCardVertical(c) {
  const lang = currentLang;
  const title = lang === 'kz' ? c.kz.title : c.en.title;
  const desc = lang === 'kz' ? c.kz.desc : c.en.desc;
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
        <button class="btn btn-primary btn-sm" onclick="event.preventDefault();" style="margin-top:8px;">
          <span class="lang-en">View Course</span><span class="lang-kz">Курсты көру</span> →
        </button>
      </div>
    </a>`;
}
