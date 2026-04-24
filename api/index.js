const express = require('express');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(express.json({ limit: '1mb' }));

const DATA_DIR = path.join(process.cwd(), 'api', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const DB_FILE = process.env.VERCEL ? path.join('/tmp', 'lab6.sqlite') : path.join(DATA_DIR, 'lab6.sqlite');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{10,20}$/;
const HERO_TYPES = new Set(['tech', 'magic', 'mutation']);
const COURSE_LEVELS = new Set(['beginner', 'intermediate', 'advanced']);

const BONUS_QUESTIONS = [
  {
    en: 'Which habit improves JavaScript learning the fastest?',
    kz: 'JavaScript-ti tez menggeruge qai adet en paidaly?',
    options: ['Ignoring errors', 'Daily coding practice', 'Watching only theory', 'Skipping exercises'],
    correct: 1,
  },
  {
    en: 'Where can you track your quiz progress in this platform?',
    kz: 'Os y platformada test progressin qaidan kore alasyz?',
    options: ['Only in browser history', 'Only in Telegram', 'In saved score history', 'It is not saved'],
    correct: 2,
  },
];

const DEFAULT_SEED = {
  users: [],
  courses: [
    {
      id: 1,
      en: { title: 'Introduction to JavaScript', desc: 'Start from the fundamentals and build real logic.' },
      kz: { title: 'JavaScript-ke kirispe', desc: 'Negizden bastap naqty logika qurudy uireningiz.' },
      category: 'beginner',
      heroType: 'tech',
      video: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
      img: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
    },
  ],
  quizzes: [
    {
      courseId: 1,
      questions: [
        {
          en: 'What is JavaScript mostly used for?',
          kz: 'JavaScript kobinese ne ushin qoldanylady?',
          options: ['Operating systems', 'Web interactivity', 'Image editing', 'Database engine'],
          correct: 1,
        },
      ],
    },
  ],
  reviews: [],
  scores: [],
  telemetry: { telegramClicks: 0 },
};

if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

const db = new sqlite3.Database(DB_FILE);

function dbExec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) return reject(err);
      resolve({ changes: this.changes || 0, lastID: this.lastID || 0 });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function cleanText(value) {
  return String(value || '').trim();
}

function parseIntSafe(value, fallback = null) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function isValidEmail(value) {
  return EMAIL_RE.test(value);
}

function isValidPhone(value) {
  return PHONE_RE.test(value);
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toCategoryName(slug) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function parseEnrolledIds(groupConcat) {
  if (!groupConcat) return [];
  return groupConcat
    .split(',')
    .map((item) => parseIntSafe(item, NaN))
    .filter((id) => Number.isInteger(id));
}

function normalizeYouTubeEmbed(url) {
  if (!url) return '';
  const raw = String(url).trim();

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace('www.', '');
    let videoId = '';

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
      } else if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      }
    } else if (host === 'youtu.be') {
      videoId = parsed.pathname.replace('/', '').split('/')[0] || '';
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    }
  } catch {
    return raw;
  }

  return raw;
}

function safeReadStoreSeed() {
  if (!fs.existsSync(STORE_FILE)) return DEFAULT_SEED;

  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
    return {
      users: Array.isArray(parsed.users) ? parsed.users : DEFAULT_SEED.users,
      courses:
        Array.isArray(parsed.courses) && parsed.courses.length
          ? parsed.courses
          : DEFAULT_SEED.courses,
      quizzes:
        Array.isArray(parsed.quizzes) && parsed.quizzes.length
          ? parsed.quizzes
          : DEFAULT_SEED.quizzes,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : DEFAULT_SEED.reviews,
      scores: Array.isArray(parsed.scores) ? parsed.scores : DEFAULT_SEED.scores,
      telemetry:
        parsed.telemetry && typeof parsed.telemetry === 'object'
          ? parsed.telemetry
          : DEFAULT_SEED.telemetry,
    };
  } catch (error) {
    console.error('Failed to read store seed:', error.message);
    return DEFAULT_SEED;
  }
}

function sanitizeCourseSeed(raw, idx = 0) {
  const id = Number(raw?.id) || idx + 1;
  const fallbackImg =
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop';

  const category = COURSE_LEVELS.has(String(raw?.category || '').toLowerCase())
    ? String(raw.category).toLowerCase()
    : 'beginner';

  const heroType = HERO_TYPES.has(String(raw?.heroType || '').toLowerCase())
    ? String(raw.heroType).toLowerCase()
    : 'tech';

  return {
    id,
    en: {
      title: cleanText(raw?.en?.title || `Course ${id}`),
      desc: cleanText(raw?.en?.desc || 'JavaScript learning module.'),
    },
    kz: {
      title: cleanText(raw?.kz?.title || `Kurs ${id}`),
      desc: cleanText(raw?.kz?.desc || 'JavaScript oqu moduli.'),
    },
    category,
    heroType,
    img: cleanText(raw?.img || fallbackImg),
    video: normalizeYouTubeEmbed(raw?.video),
  };
}

function ensureQuizQuestions(questions) {
  const normalized = Array.isArray(questions) ? [...questions] : [];
  BONUS_QUESTIONS.forEach((bonus) => {
    const exists = normalized.some((q) => q?.en === bonus.en);
    if (!exists) normalized.push({ ...bonus });
  });
  return normalized;
}

function mapCourseRow(row) {
  return {
    id: row.id,
    en: {
      title: row.title_en,
      desc: row.desc_en,
    },
    kz: {
      title: row.title_kz,
      desc: row.desc_kz,
    },
    category: row.category,
    heroType: row.hero_type,
    img: row.img,
    video: row.video,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseQuizQuestions(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return ensureQuizQuestions(Array.isArray(parsed) ? parsed : []);
  } catch {
    return ensureQuizQuestions([]);
  }
}

function extractCoursePayload(body) {
  return {
    titleEn: cleanText(body?.en?.title || body?.titleEn),
    titleKz: cleanText(body?.kz?.title || body?.titleKz),
    descEn: cleanText(body?.en?.desc || body?.descEn),
    descKz: cleanText(body?.kz?.desc || body?.descKz),
    category: toSlug(body?.category || 'beginner') || 'beginner',
    heroType: cleanText(body?.heroType || 'tech').toLowerCase(),
    img: cleanText(body?.img),
    video: normalizeYouTubeEmbed(cleanText(body?.video)),
  };
}

function validateCoursePayload(payload) {
  if (!payload.titleEn || payload.titleEn.length < 2) return 'Title (EN) must be at least 2 characters';
  if (!payload.titleKz || payload.titleKz.length < 2) return 'Title (KZ) must be at least 2 characters';
  if (!payload.descEn || payload.descEn.length < 10) return 'Description (EN) must be at least 10 characters';
  if (!payload.descKz || payload.descKz.length < 10) return 'Description (KZ) must be at least 10 characters';
  if (!COURSE_LEVELS.has(payload.category)) return 'Category must be beginner/intermediate/advanced';
  if (!HERO_TYPES.has(payload.heroType)) return 'Hero type must be tech/magic/mutation';
  if (!payload.img) return 'Image URL is required';
  if (!payload.video) return 'YouTube URL is required';
  return '';
}

async function ensureCategory(slug) {
  const safeSlug = COURSE_LEVELS.has(slug) ? slug : 'beginner';
  await dbRun('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)', [
    toCategoryName(safeSlug),
    safeSlug,
  ]);
  const row = await dbGet('SELECT id FROM categories WHERE slug = ?', [safeSlug]);
  return row?.id || null;
}

async function getCourseById(courseId) {
  const row = await dbGet(
    `
      SELECT
        c.id,
        c.title_en,
        c.title_kz,
        c.desc_en,
        c.desc_kz,
        c.hero_type,
        c.img,
        c.video,
        c.created_at,
        c.updated_at,
        cat.slug AS category
      FROM courses c
      JOIN categories cat ON cat.id = c.category_id
      WHERE c.id = ?
    `,
    [courseId],
  );

  return row ? mapCourseRow(row) : null;
}

async function getCourseList({ search = '', page = null, limit = null } = {}) {
  const where = [];
  const params = [];

  const q = cleanText(search).toLowerCase();
  if (q) {
    const like = `%${q}%`;
    where.push(
      '(LOWER(c.title_en) LIKE ? OR LOWER(c.title_kz) LIKE ? OR LOWER(c.desc_en) LIKE ? OR LOWER(c.desc_kz) LIKE ? OR LOWER(cat.slug) LIKE ?)',
    );
    params.push(like, like, like, like, like);
  }

  let sql = `
    SELECT
      c.id,
      c.title_en,
      c.title_kz,
      c.desc_en,
      c.desc_kz,
      c.hero_type,
      c.img,
      c.video,
      c.created_at,
      c.updated_at,
      cat.slug AS category
    FROM courses c
    JOIN categories cat ON cat.id = c.category_id
  `;

  if (where.length) {
    sql += ` WHERE ${where.join(' AND ')}`;
  }

  sql += ' ORDER BY c.id ASC';

  if (Number.isInteger(page) && Number.isInteger(limit) && limit > 0) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
  }

  const rows = await dbAll(sql, params);
  return rows.map(mapCourseRow);
}

async function countCourses(search = '') {
  const q = cleanText(search).toLowerCase();
  if (!q) {
    const row = await dbGet('SELECT COUNT(*) AS count FROM courses');
    return Number(row?.count || 0);
  }

  const like = `%${q}%`;
  const row = await dbGet(
    `
      SELECT COUNT(*) AS count
      FROM courses c
      JOIN categories cat ON cat.id = c.category_id
      WHERE LOWER(c.title_en) LIKE ? OR LOWER(c.title_kz) LIKE ? OR LOWER(c.desc_en) LIKE ? OR LOWER(c.desc_kz) LIKE ? OR LOWER(cat.slug) LIKE ?
    `,
    [like, like, like, like, like],
  );

  return Number(row?.count || 0);
}

async function buildAdminOverview() {
  const [
    usersRow,
    coursesRow,
    scoresRow,
    reviewsRow,
    enrollmentsRow,
    avgScoreRow,
    telegramRow,
    topCoursesRows,
    topScorersRows,
  ] = await Promise.all([
    dbGet('SELECT COUNT(*) AS count FROM users'),
    dbGet('SELECT COUNT(*) AS count FROM courses'),
    dbGet('SELECT COUNT(*) AS count FROM scores'),
    dbGet('SELECT COUNT(*) AS count FROM reviews'),
    dbGet('SELECT COUNT(*) AS count FROM enrollments'),
    dbGet('SELECT COALESCE(ROUND(AVG(percentage)), 0) AS avgScore FROM scores'),
    dbGet('SELECT COALESCE(value, 0) AS value FROM telemetry WHERE key = ?', ['telegramClicks']),
    dbAll(
      `
        SELECT c.id AS courseId, c.title_en AS title, COUNT(e.id) AS enrolled
        FROM courses c
        LEFT JOIN enrollments e ON e.course_id = c.id
        GROUP BY c.id
        ORDER BY enrolled DESC, c.id ASC
        LIMIT 5
      `,
    ),
    dbAll(
      `
        SELECT user_name AS userName, COUNT(*) AS attempts, ROUND(AVG(percentage)) AS avgPercentage
        FROM scores
        GROUP BY user_name
        ORDER BY avgPercentage DESC, attempts DESC, user_name ASC
        LIMIT 10
      `,
    ),
  ]);

  return {
    stats: {
      users: Number(usersRow?.count || 0),
      courses: Number(coursesRow?.count || 0),
      scores: Number(scoresRow?.count || 0),
      reviews: Number(reviewsRow?.count || 0),
      enrollments: Number(enrollmentsRow?.count || 0),
      avgScore: Number(avgScoreRow?.avgScore || 0),
      telegramClicks: Number(telegramRow?.value || 0),
    },
    topCourses: topCoursesRows.map((row) => ({
      courseId: row.courseId,
      title: row.title,
      enrolled: Number(row.enrolled || 0),
    })),
    topScorers: topScorersRows.map((row) => ({
      userName: row.userName,
      attempts: Number(row.attempts || 0),
      avgPercentage: Number(row.avgPercentage || 0),
    })),
  };
}

async function seedDatabase() {
  const seed = safeReadStoreSeed();
  const now = new Date().toISOString();

  const [coursesCountRow, quizzesCountRow, usersCountRow, reviewsCountRow, scoresCountRow] = await Promise.all([
    dbGet('SELECT COUNT(*) AS count FROM courses'),
    dbGet('SELECT COUNT(*) AS count FROM quizzes'),
    dbGet('SELECT COUNT(*) AS count FROM users'),
    dbGet('SELECT COUNT(*) AS count FROM reviews'),
    dbGet('SELECT COUNT(*) AS count FROM scores'),
  ]);

  const coursesCount = Number(coursesCountRow?.count || 0);
  const quizzesCount = Number(quizzesCountRow?.count || 0);
  const usersCount = Number(usersCountRow?.count || 0);
  const reviewsCount = Number(reviewsCountRow?.count || 0);
  const scoresCount = Number(scoresCountRow?.count || 0);

  if (coursesCount === 0) {
    const sanitizedCourses = seed.courses.map((course, idx) => sanitizeCourseSeed(course, idx));
    for (const course of sanitizedCourses) {
      const categoryId = await ensureCategory(course.category);
      await dbRun(
        `
          INSERT OR REPLACE INTO courses
            (id, title_en, title_kz, desc_en, desc_kz, category_id, hero_type, img, video, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          course.id,
          course.en.title,
          course.kz.title,
          course.en.desc,
          course.kz.desc,
          categoryId,
          course.heroType,
          course.img,
          normalizeYouTubeEmbed(course.video),
          now,
          now,
        ],
      );
    }
  }

  if (quizzesCount === 0) {
    for (const quiz of seed.quizzes) {
      const courseId = parseIntSafe(quiz.courseId, null);
      if (!courseId) continue;

      const courseExists = await dbGet('SELECT id FROM courses WHERE id = ?', [courseId]);
      if (!courseExists) continue;

      const questions = ensureQuizQuestions(quiz.questions);
      await dbRun(
        'INSERT OR REPLACE INTO quizzes (course_id, questions_json, updated_at) VALUES (?, ?, ?)',
        [courseId, JSON.stringify(questions), now],
      );
    }

    const missingRows = await dbAll(
      'SELECT c.id FROM courses c LEFT JOIN quizzes q ON q.course_id = c.id WHERE q.course_id IS NULL',
    );

    for (const row of missingRows) {
      await dbRun(
        'INSERT OR REPLACE INTO quizzes (course_id, questions_json, updated_at) VALUES (?, ?, ?)',
        [row.id, JSON.stringify(ensureQuizQuestions([])), now],
      );
    }
  }

  if (usersCount === 0 && Array.isArray(seed.users) && seed.users.length) {
    for (const user of seed.users) {
      const id = parseIntSafe(user.id, null);
      const name = cleanText(user.name);
      const phone = cleanText(user.phone || '+7 700 000 00 00');
      const email = cleanText(user.email).toLowerCase();
      const rawPassword = cleanText(user.password);

      if (!id || !name || !isValidEmail(email)) continue;

      const passwordHash = rawPassword.startsWith('$2')
        ? rawPassword
        : bcrypt.hashSync(rawPassword || 'Password123!', 10);

      const role = user.role === 'admin' ? 'admin' : 'user';
      const createdAt = user.registeredAt || user.createdAt || now;

      await dbRun(
        `
          INSERT OR IGNORE INTO users
            (id, name, phone, email, password_hash, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [id, name, phone, email, passwordHash, role, createdAt],
      );

      const enrolledCourses = Array.isArray(user.enrolledCourses) ? user.enrolledCourses : [];
      for (const courseRaw of enrolledCourses) {
        const courseId = parseIntSafe(courseRaw, null);
        if (!courseId) continue;

        await dbRun(
          'INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)',
          [id, courseId, now],
        );
      }
    }
  }

  const adminEmail = 'admin@jsha.kz';
  const adminExists = await dbGet('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!adminExists) {
    await dbRun(
      'INSERT INTO users (name, phone, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['Admin User', '+7 700 111 22 33', adminEmail, bcrypt.hashSync('Admin123!', 10), 'admin', now],
    );
  }

  if (reviewsCount === 0 && Array.isArray(seed.reviews) && seed.reviews.length) {
    for (const review of seed.reviews) {
      const courseId = review.courseId ? parseIntSafe(review.courseId, null) : null;
      const userName = cleanText(review.userName);
      const text = cleanText(review.text);
      const rating = Math.max(1, Math.min(5, parseIntSafe(review.rating, 5) || 5));
      const createdAt = review.createdAt || now;

      if (!userName || !text) continue;

      await dbRun(
        'INSERT INTO reviews (course_id, user_name, text, rating, created_at) VALUES (?, ?, ?, ?, ?)',
        [courseId, userName, text, rating, createdAt],
      );
    }
  }

  if (scoresCount === 0 && Array.isArray(seed.scores) && seed.scores.length) {
    for (const scoreRow of seed.scores) {
      const userId = parseIntSafe(scoreRow.userId, 0) || 0;
      const courseId = parseIntSafe(scoreRow.courseId, null);
      const score = parseIntSafe(scoreRow.score, null);
      const total = parseIntSafe(scoreRow.total, null);
      if (!courseId || score === null || !total || total <= 0) continue;

      const percentage = Math.round((score / total) * 100);
      await dbRun(
        'INSERT INTO scores (user_id, user_name, course_id, score, total, percentage, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          cleanText(scoreRow.userName) || 'Guest',
          courseId,
          score,
          total,
          percentage,
          scoreRow.date || now,
        ],
      );
    }
  }

  await dbRun('INSERT OR IGNORE INTO telemetry (key, value) VALUES (?, ?)', ['telegramClicks', 0]);

  if (seed.telemetry && Number.isFinite(Number(seed.telemetry.telegramClicks))) {
    await dbRun('UPDATE telemetry SET value = ? WHERE key = ?', [
      Number(seed.telemetry.telegramClicks),
      'telegramClicks',
    ]);
  }
}

let initPromise = null;

function initializeDb() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await dbExec('PRAGMA foreign_keys = ON;');

    await dbExec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_en TEXT NOT NULL,
        title_kz TEXT NOT NULL,
        desc_en TEXT NOT NULL,
        desc_kz TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        hero_type TEXT NOT NULL,
        img TEXT NOT NULL,
        video TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrolled_at TEXT NOT NULL,
        UNIQUE(user_id, course_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        user_name TEXT NOT NULL,
        text TEXT NOT NULL,
        rating INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        course_id INTEGER PRIMARY KEY,
        questions_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        percentage INTEGER NOT NULL,
        date TEXT NOT NULL,
        UNIQUE(user_id, course_id),
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS telemetry (
        key TEXT PRIMARY KEY,
        value INTEGER NOT NULL DEFAULT 0
      );
    `);

    await seedDatabase();
  })().catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

app.use((req, res, next) => {
  initializeDb().then(() => next()).catch(next);
});

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get(
  '/api/users',
  asyncHandler(async (req, res) => {
    const rows = await dbAll(
      `
        SELECT
          u.id,
          u.name,
          u.phone,
          u.email,
          u.role,
          u.created_at,
          COALESCE(GROUP_CONCAT(e.course_id), '') AS enrolled_ids
        FROM users u
        LEFT JOIN enrollments e ON e.user_id = u.id
        GROUP BY u.id
        ORDER BY datetime(u.created_at) DESC, u.id DESC
      `,
    );

    const users = rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      role: row.role,
      enrolledCourses: parseEnrolledIds(row.enrolled_ids),
      registeredAt: row.created_at,
    }));

    res.json(users);
  }),
);

app.post(
  '/api/register',
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body?.name);
    const phone = cleanText(req.body?.phone);
    const email = cleanText(req.body?.email).toLowerCase();
    const password = String(req.body?.password || '');

    if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!isValidPhone(phone)) return res.status(400).json({ error: 'Please enter a valid phone number' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const exists = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const createdAt = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = await dbRun(
      'INSERT INTO users (name, phone, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone, email, passwordHash, 'user', createdAt],
    );

    res.json({
      success: true,
      user: {
        id: Number(result.lastID),
        name,
        email,
        role: 'user',
      },
    });
  }),
);

app.post(
  '/api/login',
  asyncHandler(async (req, res) => {
    const email = cleanText(req.body?.email).toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const row = await dbGet('SELECT id, name, email, role, password_hash FROM users WHERE email = ?', [email]);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({
      success: true,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
      },
    });
  }),
);

app.put(
  '/api/users/:id',
  asyncHandler(async (req, res) => {
    const id = parseIntSafe(req.params.id, null);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });

    const current = await dbGet('SELECT id, name, phone, role FROM users WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ error: 'User not found' });

    const name = cleanText(req.body?.name || current.name);
    const phone = cleanText(req.body?.phone || current.phone);
    const role = req.body?.role === 'admin' ? 'admin' : 'user';

    if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!isValidPhone(phone)) return res.status(400).json({ error: 'Invalid phone number' });

    await dbRun('UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ?', [name, phone, role, id]);

    res.json({ success: true });
  }),
);

app.delete(
  '/api/users/:id',
  asyncHandler(async (req, res) => {
    const id = parseIntSafe(req.params.id, null);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });

    await dbRun('DELETE FROM scores WHERE user_id = ?', [id]);
    const result = await dbRun('DELETE FROM users WHERE id = ?', [id]);

    if (!result.changes) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true });
  }),
);

app.get(
  '/api/courses',
  asyncHandler(async (req, res) => {
    const search = cleanText(req.query.search || '');
    const page = parseIntSafe(req.query.page, null);
    const limit = parseIntSafe(req.query.limit, null);

    if (page && limit) {
      const safeLimit = Math.max(1, Math.min(limit, 50));
      const safePage = Math.max(1, page);
      const items = await getCourseList({ search, page: safePage, limit: safeLimit });
      const total = await countCourses(search);

      return res.json({
        items,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
      });
    }

    const items = await getCourseList({ search });
    return res.json(items);
  }),
);

app.post(
  '/api/courses',
  asyncHandler(async (req, res) => {
    const payload = extractCoursePayload(req.body);
    const error = validateCoursePayload(payload);
    if (error) return res.status(400).json({ error });

    const categoryId = await ensureCategory(payload.category);
    const now = new Date().toISOString();

    const result = await dbRun(
      `
        INSERT INTO courses
          (title_en, title_kz, desc_en, desc_kz, category_id, hero_type, img, video, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.titleEn,
        payload.titleKz,
        payload.descEn,
        payload.descKz,
        categoryId,
        payload.heroType,
        payload.img,
        payload.video,
        now,
        now,
      ],
    );

    const courseId = Number(result.lastID);
    await dbRun('INSERT OR REPLACE INTO quizzes (course_id, questions_json, updated_at) VALUES (?, ?, ?)', [
      courseId,
      JSON.stringify(ensureQuizQuestions([])),
      now,
    ]);

    const course = await getCourseById(courseId);
    res.json({ success: true, course });
  }),
);

app.put(
  '/api/courses/:id',
  asyncHandler(async (req, res) => {
    const courseId = parseIntSafe(req.params.id, null);
    if (!courseId) return res.status(400).json({ error: 'Invalid course id' });

    const existing = await dbGet('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (!existing) return res.status(404).json({ error: 'Course not found' });

    const payload = extractCoursePayload(req.body);
    const error = validateCoursePayload(payload);
    if (error) return res.status(400).json({ error });

    const categoryId = await ensureCategory(payload.category);
    const now = new Date().toISOString();

    await dbRun(
      `
        UPDATE courses
        SET title_en = ?, title_kz = ?, desc_en = ?, desc_kz = ?, category_id = ?, hero_type = ?, img = ?, video = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        payload.titleEn,
        payload.titleKz,
        payload.descEn,
        payload.descKz,
        categoryId,
        payload.heroType,
        payload.img,
        payload.video,
        now,
        courseId,
      ],
    );

    const course = await getCourseById(courseId);
    res.json({ success: true, course });
  }),
);

app.delete(
  '/api/courses/:id',
  asyncHandler(async (req, res) => {
    const courseId = parseIntSafe(req.params.id, null);
    if (!courseId) return res.status(400).json({ error: 'Invalid course id' });

    const result = await dbRun('DELETE FROM courses WHERE id = ?', [courseId]);
    if (!result.changes) return res.status(404).json({ error: 'Course not found' });

    res.json({ success: true });
  }),
);

app.post(
  '/api/enroll',
  asyncHandler(async (req, res) => {
    const userId = parseIntSafe(req.body?.userId, null);
    const courseId = parseIntSafe(req.body?.courseId, null);

    if (!userId || !courseId) return res.status(400).json({ error: 'userId and courseId are required' });

    const userExists = await dbGet('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userExists) return res.status(404).json({ error: 'User not found' });

    const courseExists = await dbGet('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (!courseExists) return res.status(404).json({ error: 'Course not found' });

    await dbRun('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)', [
      userId,
      courseId,
      new Date().toISOString(),
    ]);

    res.json({ success: true });
  }),
);

app.get(
  '/api/reviews',
  asyncHandler(async (req, res) => {
    const courseId = parseIntSafe(req.query.courseId, null);

    const sql = courseId
      ? 'SELECT id, course_id, user_name, text, rating, created_at FROM reviews WHERE course_id = ? ORDER BY datetime(created_at) ASC, id ASC'
      : 'SELECT id, course_id, user_name, text, rating, created_at FROM reviews ORDER BY datetime(created_at) ASC, id ASC';

    const rows = courseId ? await dbAll(sql, [courseId]) : await dbAll(sql);

    const reviews = rows.map((row) => ({
      id: row.id,
      courseId: row.course_id,
      userName: row.user_name,
      text: row.text,
      rating: row.rating,
      createdAt: row.created_at,
    }));

    res.json(reviews);
  }),
);

app.post(
  '/api/reviews',
  asyncHandler(async (req, res) => {
    const courseId = req.body?.courseId ? parseIntSafe(req.body.courseId, null) : null;
    const userName = cleanText(req.body?.userName);
    const text = cleanText(req.body?.text);
    const rating = Math.max(1, Math.min(5, parseIntSafe(req.body?.rating, 5) || 5));

    if (!userName || userName.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!text || text.length < 10) return res.status(400).json({ error: 'Review text must be at least 10 characters' });

    if (courseId) {
      const courseExists = await dbGet('SELECT id FROM courses WHERE id = ?', [courseId]);
      if (!courseExists) return res.status(404).json({ error: 'Course not found' });
    }

    const createdAt = new Date().toISOString();
    const result = await dbRun(
      'INSERT INTO reviews (course_id, user_name, text, rating, created_at) VALUES (?, ?, ?, ?, ?)',
      [courseId, userName, text, rating, createdAt],
    );

    res.json({
      success: true,
      review: {
        id: Number(result.lastID),
        courseId,
        userName,
        text,
        rating,
        createdAt,
      },
    });
  }),
);

app.get(
  '/api/quizzes',
  asyncHandler(async (req, res) => {
    const rows = await dbAll('SELECT course_id, questions_json FROM quizzes ORDER BY course_id ASC');
    const quizzes = rows.map((row) => ({
      courseId: row.course_id,
      questions: parseQuizQuestions(row.questions_json),
    }));
    res.json(quizzes);
  }),
);

app.get(
  '/api/quizzes/:courseId',
  asyncHandler(async (req, res) => {
    const courseId = parseIntSafe(req.params.courseId, null);
    if (!courseId) return res.status(400).json({ error: 'Invalid course id' });

    const row = await dbGet('SELECT course_id, questions_json FROM quizzes WHERE course_id = ?', [courseId]);
    if (!row) return res.status(404).json({ error: 'Quiz not found' });

    res.json({
      courseId: row.course_id,
      questions: parseQuizQuestions(row.questions_json),
    });
  }),
);

app.get(
  '/api/scores',
  asyncHandler(async (req, res) => {
    const userId = parseIntSafe(req.query.userId, null);

    const sql = userId
      ? 'SELECT user_id, user_name, course_id, score, total, percentage, date FROM scores WHERE user_id = ? ORDER BY datetime(date) DESC, id DESC'
      : 'SELECT user_id, user_name, course_id, score, total, percentage, date FROM scores ORDER BY datetime(date) DESC, id DESC';

    const rows = userId ? await dbAll(sql, [userId]) : await dbAll(sql);

    const scores = rows.map((row) => ({
      userId: row.user_id,
      userName: row.user_name,
      courseId: row.course_id,
      score: row.score,
      total: row.total,
      percentage: row.percentage,
      date: row.date,
    }));

    res.json(scores);
  }),
);

app.post(
  '/api/scores',
  asyncHandler(async (req, res) => {
    const userId = parseIntSafe(req.body?.userId, 0) || 0;
    const userName = cleanText(req.body?.userName) || 'Guest';
    const courseId = parseIntSafe(req.body?.courseId, null);
    const score = parseIntSafe(req.body?.score, null);
    const total = parseIntSafe(req.body?.total, null);

    if (!courseId) return res.status(400).json({ error: 'courseId is required' });
    if (score === null || total === null || total <= 0 || score < 0 || score > total) {
      return res.status(400).json({ error: 'Invalid score payload' });
    }

    const courseExists = await dbGet('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (!courseExists) return res.status(404).json({ error: 'Course not found' });

    const percentage = Math.round((score / total) * 100);
    const date = new Date().toISOString();

    await dbRun(
      `
        INSERT INTO scores (user_id, user_name, course_id, score, total, percentage, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, course_id)
        DO UPDATE SET
          user_name = excluded.user_name,
          score = excluded.score,
          total = excluded.total,
          percentage = excluded.percentage,
          date = excluded.date
      `,
      [userId, userName, courseId, score, total, percentage, date],
    );

    res.json({
      success: true,
      entry: {
        userId,
        userName,
        courseId,
        score,
        total,
        percentage,
        date,
      },
    });
  }),
);

app.post(
  '/api/telemetry/telegram-click',
  asyncHandler(async (req, res) => {
    await dbRun('UPDATE telemetry SET value = value + 1 WHERE key = ?', ['telegramClicks']);
    const row = await dbGet('SELECT value FROM telemetry WHERE key = ?', ['telegramClicks']);
    res.json({ success: true, telegramClicks: Number(row?.value || 0) });
  }),
);

app.get(
  '/api/admin/overview',
  asyncHandler(async (req, res) => {
    res.json(await buildAdminOverview());
  }),
);

app.get(
  '/api/export/users',
  asyncHandler(async (req, res) => {
    const users = await dbAll(
      `
        SELECT
          u.id,
          u.name,
          u.phone,
          u.email,
          u.role,
          u.created_at,
          COALESCE(GROUP_CONCAT(e.course_id), '') AS enrolled_ids
        FROM users u
        LEFT JOIN enrollments e ON e.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC, u.id DESC
      `,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 14 },
      { header: 'Registered', key: 'registeredAt', width: 28 },
      { header: 'Enrolled Count', key: 'enrolledCount', width: 16 },
      { header: 'Enrolled IDs', key: 'enrolledIds', width: 30 },
    ];

    users.forEach((row) => {
      const enrolled = parseEnrolledIds(row.enrolled_ids);
      sheet.addRow({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        role: row.role,
        registeredAt: row.created_at,
        enrolledCount: enrolled.length,
        enrolledIds: enrolled.join(', '),
      });
    });

    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  }),
);

app.get(
  '/api/export/full-report',
  asyncHandler(async (req, res) => {
    const workbook = new ExcelJS.Workbook();

    const users = await dbAll(
      `
        SELECT
          u.id,
          u.name,
          u.phone,
          u.email,
          u.role,
          u.created_at,
          COALESCE(GROUP_CONCAT(e.course_id), '') AS enrolled_ids
        FROM users u
        LEFT JOIN enrollments e ON e.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC, u.id DESC
      `,
    );

    const usersSheet = workbook.addWorksheet('Users');
    usersSheet.columns = [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 14 },
      { header: 'Registered', key: 'registeredAt', width: 28 },
      { header: 'Enrolled IDs', key: 'enrolledIds', width: 30 },
    ];

    users.forEach((row) => {
      usersSheet.addRow({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        role: row.role,
        registeredAt: row.created_at,
        enrolledIds: parseEnrolledIds(row.enrolled_ids).join(', '),
      });
    });

    const courses = await dbAll(
      `
        SELECT
          c.id,
          c.title_en,
          c.title_kz,
          c.desc_en,
          c.desc_kz,
          c.hero_type,
          c.img,
          c.video,
          cat.slug AS category,
          c.created_at,
          c.updated_at
        FROM courses c
        JOIN categories cat ON cat.id = c.category_id
        ORDER BY c.id ASC
      `,
    );

    const coursesSheet = workbook.addWorksheet('Courses');
    coursesSheet.columns = [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Title EN', key: 'titleEn', width: 34 },
      { header: 'Title KZ', key: 'titleKz', width: 34 },
      { header: 'Desc EN', key: 'descEn', width: 50 },
      { header: 'Desc KZ', key: 'descKz', width: 50 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Hero Type', key: 'heroType', width: 16 },
      { header: 'Video', key: 'video', width: 50 },
      { header: 'Created', key: 'createdAt', width: 28 },
      { header: 'Updated', key: 'updatedAt', width: 28 },
    ];

    courses.forEach((row) => {
      coursesSheet.addRow({
        id: row.id,
        titleEn: row.title_en,
        titleKz: row.title_kz,
        descEn: row.desc_en,
        descKz: row.desc_kz,
        category: row.category,
        heroType: row.hero_type,
        video: row.video,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    });

    const scores = await dbAll(
      'SELECT user_id, user_name, course_id, score, total, percentage, date FROM scores ORDER BY datetime(date) DESC, id DESC',
    );

    const scoresSheet = workbook.addWorksheet('Scores');
    scoresSheet.columns = [
      { header: 'User ID', key: 'userId', width: 12 },
      { header: 'User', key: 'userName', width: 24 },
      { header: 'Course ID', key: 'courseId', width: 12 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Percentage', key: 'percentage', width: 12 },
      { header: 'Date', key: 'date', width: 28 },
    ];

    scores.forEach((row) => {
      scoresSheet.addRow({
        userId: row.user_id,
        userName: row.user_name,
        courseId: row.course_id,
        score: row.score,
        total: row.total,
        percentage: row.percentage,
        date: row.date,
      });
    });

    const reviews = await dbAll(
      'SELECT id, course_id, user_name, rating, text, created_at FROM reviews ORDER BY datetime(created_at) DESC, id DESC',
    );

    const reviewsSheet = workbook.addWorksheet('Reviews');
    reviewsSheet.columns = [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'Course ID', key: 'courseId', width: 12 },
      { header: 'User', key: 'userName', width: 24 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Text', key: 'text', width: 60 },
      { header: 'Created At', key: 'createdAt', width: 28 },
    ];

    reviews.forEach((row) => {
      reviewsSheet.addRow({
        id: row.id,
        courseId: row.course_id,
        userName: row.user_name,
        rating: row.rating,
        text: row.text,
        createdAt: row.created_at,
      });
    });

    const analyticsSheet = workbook.addWorksheet('Analytics');
    analyticsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    const overview = await buildAdminOverview();
    Object.entries(overview.stats).forEach(([metric, value]) => {
      analyticsSheet.addRow({ metric, value });
    });

    res.setHeader('Content-Disposition', 'attachment; filename=jsha-full-report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  }),
);

app.get(
  '/api/export/analytics.json',
  asyncHandler(async (req, res) => {
    res.json(await buildAdminOverview());
  }),
);

app.use((err, req, res, next) => {
  console.error('API error:', err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
