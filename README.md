# JS Heroes Academy

Marvel стиліндегі JavaScript оқыту платформасы. 20 курс, 20 тест, қазақ/ағылшын тілдерінде, Telegram бот.

## 🚀 Жүктеу

```bash
cd /Users/milady/Desktop/JSHA
npm install
npm start
```

**Сайт:** http://localhost:3003

## 🤖 Telegram Бот

Ботты іске қосу үшін:

1. **@BotFather** ашып, `/newbot` жазыңыз
2. Бот атауын және username беріңіз (мысалы: `jsha_bot`)
3. Алынған **токенді** сақтаңыз
4. `.env` файл жасаңыз:
   ```
   BOT_TOKEN=7123456789:ABCdefGHIjkl...
   WEB_URL=http://localhost:3003
   ```
5. Серверді қайта іске қосыңыз: `npm start`

### Бот командалары

| Команда | Сипаттама |
|---------|-----------|
| `/start` | Бастау мен мәзір |
| `/courses` | 20 курс тізімі |
| `/quiz` | Тесттер тізімі |
| `/quiz 5` | 5-ші курс бойынша тест |
| `/stats` | Статистиканы көру |
| `/contact` | Байланыс ақпараты |
| `/help` | Командалар көмекшісі |

## 🛠 Функциялар

- ✅ Figma дизайны (Dark: purple, Light: blue)
- ✅ EN/KZ тіл ауыстыру
- ✅ Dark/Light режим
- ✅ 20 курс, YouTube видеолар
- ✅ Пікірлер (басты бет + әр сабақ)
- ✅ Админ панель + Excel экспорт
- ✅ 20 тест (тест режимі + карточкалар)
- ✅ Балл сақтау
- ✅ Telegram бот

## 📁 Құрылым

```
/public
  /css/style.css    — Барлық стильдер
  /js/main.js       — Тіл/тема жүйелері
  *.html            — HTML беттер
server.js           — Express сервер + API
bot.js              — Telegram бот
.env                — Конфигурация
```
