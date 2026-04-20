# JS Heroes Academy (React + Express)

Толық жоба енді React SPA форматында жұмыс істейді, ал backend Express API арқылы деректерді тұрақты сақтайды.

## Негізгі жаңартулар

- Ескі HTML UI/UX React-қа көшірілді (дизайн/класс құрылымы сақталды)
- Telegram bot батырмасы (floating CTA) қосылды және telemetry есепке алынады
- Quiz сұрақтары әр курсқа кеңейтілді (4 → 6)
- Admin panel күшейтілді:
  - Users/Courses/Scores/Analytics табтары
  - Full Excel report экспорты
  - Analytics JSON экспорты
- Пайдаланушылар, курстар, пікірлер, баллдар серверде `data/store.json` ішінде сақталады
- YouTube видеолар normalize жасалып (`youtube-nocookie embed`) тұрақтандырылды

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

- Persistence файлы: `data/store.json`
- Бұл файлда users/reviews/scores/courses/quizzes/telemetry сақталады

## Telegram

- Бот сілтемесі: `https://t.me/jsheroes_bot`
- Bot process `server.js` іске қосылғанда `bot.js` арқылы көтеріледі (токен дұрыс орнатылған жағдайда)
