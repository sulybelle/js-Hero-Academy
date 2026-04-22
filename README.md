# JS Heroes Academy (React + Express)

Толық жоба енді React SPA форматында жұмыс істейді, ал backend Express API + SQLite деректер базасы арқылы деректерді тұрақты сақтайды.

## Негізгі жаңартулар

- Ескі HTML UI/UX React-қа көшірілді (дизайн/класс құрылымы сақталды)
- Telegram bot батырмасы (floating CTA) қосылды және telemetry есепке алынады
- Quiz сұрақтары әр курсқа кеңейтілді (4 → 6)
- Admin panel күшейтілді:
  - Users/Courses/Scores/Analytics табтары
  - Full Excel report экспорты
  - Analytics JSON экспорты
- Негізгі деректер SQLite ішінде сақталады: `data/lab6.sqlite`
- `data/store.json` тек бастапқы seed көзі ретінде қолданылады (алғашқы толтыруға)
- YouTube видеолар normalize жасалып (`youtube-nocookie embed`) тұрақтандырылды
- Парольдер `bcrypt` арқылы хэштеледі
- CRUD API толықтырылды (`GET / POST / PUT / DELETE`)
- Модельдер мен байланыстар енгізілді: `users`, `categories`, `courses`, `enrollments` (+ `reviews`, `scores`, `quizzes`)

## Іске қосу

### 1) Backend

```bash
npm run server
```

Server: `http://localhost:3003`

### 2) Frontend (dev)

```bash
npm run dev
```

Vite: `http://localhost:5173` (`/api` автоматты түрде backend-ке proxy болады)

### 3) Production build

```bash
npm run build
npm run server
```

`server.js` дайын `dist` бар болса, SPA-ны сол жерден береді.

## Деректер сақтау

- Негізгі деректер базасы: `data/lab6.sqlite`
- Seed көзі: `data/store.json`

## Admin Test Account

- Email: `admin@jsha.kz`
- Password: `Admin123!`

## Telegram

- Бот сілтемесі: `https://t.me/jsheroes_bot`
- Bot process `server.js` іске қосылғанда `bot.js` арқылы көтеріледі (токен дұрыс орнатылған жағдайда)
