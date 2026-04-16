 const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || '8673437480:AAGFZMw_0QJbyuhRZEaesDTT7-p3RVPZ-jk';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3003';

const bot = new Telegraf(BOT_TOKEN);

// /start - Бастау
bot.command('start', async (ctx) => {
  const welcomeMsg = `🦸‍♂️ <b>JS Heroes Academy</b> ботына қош келдіңіз!

Мен сізге оқу платформасындағы курстар мен тесттер туралы ақпарат беремін.

📚 <b>Негізгі командалар:</b>
/courses - Барлық курстарды көру
/quiz - Тесттер тізімі
/stats - Платформа статистикасы
/help - Көмек

🌐 <a href="${WEB_URL}">Веб-сайтқа өту</a>`;

  await ctx.replyWithHTML(welcomeMsg, {
    reply_markup: mainMenuKeyboard()
  });
});

// /help - Көмек
bot.command('help', async (ctx) => {
  const helpMsg = `📖 <b>Бот командалары:</b>

/start - Ботты іске қосу
/courses - 20 курстың тізімі
/quiz - Барлық тесттер
/stats - Статистика
/contact - Байланыс ақпараты

ℹ️ <b>Тест өту үшін:</b>
/quiz 1 — Бірінші курс бойынша тест
/quiz 5 — Бесінші курс бойынша тест`;

  await ctx.replyWithHTML(helpMsg);
});

// /courses - Курстар тізімі
bot.command('courses', async (ctx) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${WEB_URL}/api/courses`);
    const courses = await res.json();

    let msg = '📚 <b>Барлық курстар (20):</b>\n\n';
    courses.slice(0, 10).forEach((c, i) => {
      const icon = c.heroType === 'tech' ? '⚙️' : c.heroType === 'magic' ? '✨' : '🧬';
      msg += `${icon} <b>${i + 1}.</b> ${c.en.title}\n`;
      msg += `   <i>${c.kz.title}</i>\n`;
      msg += `   🏷 ${c.category.toUpperCase()} | 🎥 ${c.heroType.toUpperCase()}\n\n`;
    });
    msg += `📊 <i>Толық тізім сайтта: ${WEB_URL}/courses</i>`;

    await ctx.replyWithHTML(msg, {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url('🌐 Курстар бетіне өту', `${WEB_URL}/courses`)],
        [Markup.button.callback('📋 Келесі 10 курс', 'courses_next')]
      ])
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Серверге қосылу мүмкін болмады. Кейінірек қайта көріңіз.');
  }
});

// Callback для следующих курсов
bot.action('courses_next', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${WEB_URL}/api/courses`);
    const courses = await res.json();

    let msg = '📚 <b>Курстар (11-20):</b>\n\n';
    courses.slice(10, 20).forEach((c, i) => {
      const icon = c.heroType === 'tech' ? '⚙️' : c.heroType === 'magic' ? '✨' : '🧬';
      msg += `${icon} <b>${i + 11}.</b> ${c.en.title}\n`;
      msg += `   <i>${c.kz.title}</i>\n`;
      msg += `   🏷 ${c.category.toUpperCase()} | 🎥 ${c.heroType.toUpperCase()}\n\n`;
    });
    msg += `📊 <i>Барлық курстар: ${WEB_URL}/courses</i>`;

    await ctx.editMessageText(msg, {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url('🌐 Курстар бетіне өту', `${WEB_URL}/courses`)],
        [Markup.button.callback('📋 Алғашқы 10 курс', 'courses_prev')]
      ])
    });
  } catch (err) {
    await ctx.reply('❌ Қате орын алды');
  }
});

bot.action('courses_prev', async (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('Алғашқы 10 курс /courses командасымен қараңыз 👆');
});

// /quiz - Тесттер тізімі
bot.command('quiz', async (ctx) => {
  const args = ctx.message.text.split(' ');
  const courseId = args[1];

  if (courseId) {
    // Конкретный тест
    await startQuiz(ctx, parseInt(courseId));
  } else {
    // Список всех тестов
    try {
      const fetch = (await import('node-fetch')).default;
      const [quizRes, courseRes] = await Promise.all([
        fetch(`${WEB_URL}/api/quizzes`),
        fetch(`${WEB_URL}/api/courses`)
      ]);
      const quizzes = await quizRes.json();
      const courses = await courseRes.json();

      let msg = '🎯 <b>Тесттер тізімі (20):</b>\n\n';
      quizzes.slice(0, 10).forEach((q, i) => {
        const c = courses.find(c => c.id === q.courseId);
        msg += `${i + 1}. <b>${c ? c.en.title : 'Курс ' + q.courseId}</b>\n`;
        msg += `   <i>${c ? c.kz.title : ''}</i>\n`;
        msg += `   📝 ${q.questions.length} сұрақ\n`;
        msg += `   /quiz ${q.courseId} — Тестті бастау\n\n`;
      });
      msg += 'ℹ️ Тест нөмірін басып, тестті сайтта ашыңыз';

      // Создаем inline кнопки для первых 5 тестов
      const buttons = quizzes.slice(0, 5).map(q => {
        const c = courses.find(c => c.id === q.courseId);
        return [Markup.button.url(`📝 ${c ? c.en.title.substring(0, 25) : 'Test'}`, `${WEB_URL}/quiz?course=${q.courseId}`)];
      });

      await ctx.replyWithHTML(msg, {
        reply_markup: Markup.inlineKeyboard([
          ...buttons,
          [Markup.button.url('🎯 Барлық тесттер', `${WEB_URL}/quiz`)]
        ])
      });
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Тесттер тізімін жүктеу сәтсіз аяқталды.');
    }
  }
});

// /stats - Статистика
bot.command('stats', async (ctx) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const [usersRes, coursesRes, scoresRes] = await Promise.all([
      fetch(`${WEB_URL}/api/users`),
      fetch(`${WEB_URL}/api/courses`),
      fetch(`${WEB_URL}/api/scores`)
    ]);
    const users = await usersRes.json();
    const courses = await coursesRes.json();
    const scores = await scoresRes.json();

    const msg = `📊 <b>JS Heroes Academy — Статистика</b>

👥 Пайдаланушылар: <b>${users.length}</b>
📚 Курстар: <b>${courses.length}</b>
📝 Тесттер: <b>${courses.length}</b>
✅ Өтілген тесттер: <b>${scores.length}</b>

🌐 <a href="${WEB_URL}">Сайтқа өту</a>
📚 <a href="${WEB_URL}/courses">Курстар</a>
🎯 <a href="${WEB_URL}/quiz">Тесттер</a>`;

    await ctx.replyWithHTML(msg);
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Статистиканы жүктеу сәтсіз аяқталды.');
  }
});

// /contact - Байланыс
bot.command('contact', async (ctx) => {
  await ctx.replyWithHTML(
    `📞 <b>Байланыс ақпараты:</b>

📧 Email: info@jsha.kz
📱 Телефон: +7 700 123 45 67
🌐 Веб-сайт: ${WEB_URL}
📍 Мекенжай: Астана, Қазақстан

Жұмыс уақыты: Дүйсенбі – Жұма, 09:00 – 18:00`,
    Markup.inlineKeyboard([
      [Markup.button.url('🌐 Сайтқа өту', WEB_URL)],
      [Markup.button.url('📧 Email жазу', 'mailto:info@jsha.kz')]
    ])
  );
});

// ===== HELPERS =====

async function startQuiz(ctx, courseId) {
  try {
    const fetch = (await import('node-fetch')).default;
    const [quizRes, courseRes] = await Promise.all([
      fetch(`${WEB_URL}/api/quizzes/${courseId}`),
      fetch(`${WEB_URL}/api/courses`)
    ]);
    
    if (!quizRes.ok) {
      await ctx.reply('❌ Бұл курс үшін тест табылмады.');
      return;
    }

    const quiz = await quizRes.json();
    const courses = await courseRes.json();
    const course = courses.find(c => c.id === courseId);

    const msg = `🎯 <b>${course ? course.en.title : 'Test'}</b>

📋 ${quiz.questions.length} сұрақ
🏷 Деңгей: ${course ? course.category : 'N/A'}

Тестті сайтта өтіп, нәтижеңізді сақтаңыз!`;

    await ctx.replyWithHTML(msg, {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url('▶️ Тестті бастау', `${WEB_URL}/quiz?course=${courseId}`)],
        [Markup.button.url('📹 Курс видеосы', `${WEB_URL}/course/${courseId}`)]
      ])
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Тестті жүктеу сәтсіз аяқталды.');
  }
}

function mainMenuKeyboard() {
  return Markup.keyboard([
    ['📚 Курстар', '🎯 Тесттер'],
    ['📊 Статистика', '📞 Байланыс']
  ]).resize();
}

// ===== TEXT HANDLERS =====

bot.hears('📚 Курстар', (ctx) => ctx.replyWithHTML('📚 Курстар тізімі үшін /courses жазыңыз'));
bot.hears('🎯 Тесттер', (ctx) => ctx.replyWithHTML('🎯 Тесттер үшін /quiz жазыңыз'));
bot.hears('📊 Статистика', (ctx) => ctx.replyWithHTML('📊 Статистика үшін /stats жазыңыз'));
bot.hears('📞 Байланыс', (ctx) => ctx.replyWithHTML('📞 Байланыс үшін /contact жазыңыз'));

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Ошибка для ${ctx.updateType}`, err);
  ctx.reply('❌ Қате орын алды. Кейінірек қайта көріңіз.');
});

// ===== START BOT =====
async function startBot() {
  if (BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('\n🔴 Telegram бот іске қосылмады — токен орнатылмаған.\n');
    console.log('📋 Ботты іске қосу үшін:');
    console.log('1. @BotFather-ға жазыңыз');
    console.log('2. /newbot командасымен жаңа бот жасаңыз');
    console.log('3. Алған токенді BOT_TOKEN айнымалысына енгізіңіз:');
    console.log('   • .env файл: BOT_TOKEN=ваш_токен');
    console.log('   • Или export BOT_TOKEN=ваш_токен');
    console.log('   • Или bot.js файлында YOUR_BOT_TOKEN_HERE орнына жазу\n');
    return;
  }

  try {
    // Удаляем вебхук перед запуском
    await bot.telegram.deleteWebhook();
    // Запускаем polling
    await bot.launch();
    console.log('✅ Telegram бот іске қосылды!');
    console.log('🤖 @ваш_бот_username');
    console.log('📊 Командалар: /start, /courses, /quiz, /stats, /help');
  } catch (err) {
    console.error('❌ Ботты іске қосу сәтсіз:', err.message);
  }
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { startBot, bot };

// Автозапуск если файл запущен напрямую
if (require.main === module) {
  startBot();
}
