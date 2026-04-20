const express = require('express');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const app = express();
const PORT = 3003;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DIST_DIR = path.join(__dirname, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const VITE_INDEX = path.join(__dirname, 'index.html');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}
 
let users = [];
let reviews = [];
let scores = [];
let telemetry = { telegramClicks: 0 };

const courses = [
  { id:1, en:{title:'Introduction to JavaScript',desc:'Begin your hero journey — learn what JavaScript is and how it powers the web.'},kz:{title:'JavaScript-ке кіріспе',desc:'Батыр жолыңызды бастаңыз — JavaScript деген не және ол вебті қалай басқарады.'},category:'beginner',heroType:'tech',video:'https://www.youtube.com/embed/W6NZfCO5SIk',img:'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop'},
  { id:2, en:{title:'Variables & Data Types',desc:'Master the building blocks: var, let, const and primitive types.'},kz:{title:'Айнымалылар мен деректер түрлері',desc:'Негізгі құрылымдарды меңгеріңіз: var, let, const және қарапайым түрлер.'},category:'beginner',heroType:'tech',video:'https://www.youtube.com/embed/edlFjlzxkSI',img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop'},
  { id:3, en:{title:'Operators & Expressions',desc:'Wield arithmetic, comparison and logical operators like a true hero.'},kz:{title:'Операторлар мен өрнектер',desc:'Арифметикалық, салыстыру және логикалық операторларды шебер қолданыңыз.'},category:'beginner',heroType:'tech',video:'https://www.youtube.com/embed/FZzyij43A54',img:'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop'},
  { id:4, en:{title:'Control Flow: if / else / switch',desc:'Make decisions in your code — direct the flow like a strategist.'},kz:{title:'Басқару ағыны: if / else / switch',desc:'Кодта шешім қабылдаңыз — ағынды стратег сияқты басқарыңыз.'},category:'beginner',heroType:'tech',video:'https://www.youtube.com/embed/IsG4Xd6LlsM',img:'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=250&fit=crop'},
  { id:5, en:{title:'Loops: for, while, do-while',desc:'Repeat actions efficiently — loops are the backbone of automation.'},kz:{title:'Циклдар: for, while, do-while',desc:'Әрекеттерді тиімді қайталаңыз — циклдар автоматтандырудың негізі.'},category:'beginner',heroType:'tech',video:'https://www.youtube.com/embed/Kn06785vJyg',img:'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=250&fit=crop'},
  { id:6, en:{title:'Functions & Scope',desc:'Create reusable powers — functions are your super abilities.'},kz:{title:'Функциялар мен аумақ',desc:'Қайта пайдаланылатын күштер жасаңыз — функциялар сіздің суперқабілеттеріңіз.'},category:'beginner',heroType:'tech',video:'https://www.youtube.com/embed/N8ap4k_1QEQ',img:'https://i.ytimg.com/vi/t_fCi2spRz0/maxresdefault.jpg'},
  { id:7, en:{title:'Arrays & Array Methods',desc:'Store collections of data and transform them with powerful methods.'},kz:{title:'Массивтер мен әдістері',desc:'Деректер жиынтығын сақтаңыз және оларды қуатты әдістермен түрлендіріңіз.'},category:'beginner',heroType:'tech',video:'https://www.youtube.com/embed/oigfaZ5ApsM',img:'https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=400&h=250&fit=crop'},
  { id:8, en:{title:'Objects & JSON',desc:'Structure your data like a S.H.I.E.L.D. database with objects.'},kz:{title:'Объектілер мен JSON',desc:'S.H.I.E.L.D. деректер базасы сияқты деректеріңізді құрылымдаңыз.'},category:'intermediate',heroType:'magic',video:'https://www.youtube.com/embed/PFmuCDHHpwk',img:'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop'},
  { id:9, en:{title:'DOM Manipulation',desc:'Control the web page — select, modify and create elements at will.'},kz:{title:'DOM манипуляциясы',desc:'Веб-бетті басқарыңыз — элементтерді таңдаңыз, өзгертіңіз және жасаңыз.'},category:'intermediate',heroType:'magic',video:'https://www.youtube.com/embed/y17RuWkWdn8',img:'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&h=250&fit=crop'},
  { id:10, en:{title:'Events & Event Handling',desc:'React to user actions — clicks, inputs and keyboard like Spider-sense.'},kz:{title:'Оқиғалар мен оқиға өңдеу',desc:'Пайдаланушы әрекеттеріне жауап беріңіз — клик, енгізу, пернетақта.'},category:'intermediate',heroType:'magic',video:'https://www.youtube.com/embed/XF1_MlZ5l6M',img:'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop'},
  { id:11, en:{title:'ES6 Arrow Functions',desc:'Write cleaner, shorter functions with the modern arrow syntax.'},kz:{title:'ES6 көрсеткі функциялары',desc:'Заманауи көрсеткі синтаксисімен таза, қысқа функциялар жазыңыз.'},category:'intermediate',heroType:'magic',video:'https://www.youtube.com/embed/h33Srr5J9nY',img:'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=250&fit=crop'},
  { id:12, en:{title:'Destructuring & Spread',desc:'Unpack values from arrays and objects like opening a mystery box.'},kz:{title:'Деструктуризация мен Spread',desc:'Массивтер мен объектілерден мәндерді ашыңыз.'},category:'intermediate',heroType:'magic',video:'https://www.youtube.com/embed/NIq3qLaHCIs',img:'https://images.unsplash.com/photo-1550439062-609e1531270e?w=400&h=250&fit=crop'},
  { id:13, en:{title:'Promises',desc:'Handle asynchronous missions with Promises — never lose track.'},kz:{title:'Promises (уәделер)',desc:'Асинхронды миссияларды Promises арқылы басқарыңыз.'},category:'intermediate',heroType:'magic',video:'https://www.youtube.com/embed/DHvZLI7Db8E',img:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop'},
  { id:14, en:{title:'Async / Await',desc:'Write asynchronous code that reads like a story — clean and powerful.'},kz:{title:'Async / Await',desc:'Асинхронды кодты оңай және қуатты жазыңыз.'},category:'advanced',heroType:'magic',video:'https://www.youtube.com/embed/V_Kr9OSfDeU',img:'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=250&fit=crop'},
  { id:15, en:{title:'Fetch API & AJAX',desc:'Communicate with servers — send and receive data across the network.'},kz:{title:'Fetch API және AJAX',desc:'Серверлермен байланысыңыз — желі арқылы деректерді жіберіңіз және алыңыз.'},category:'advanced',heroType:'mutation',video:'https://www.youtube.com/embed/cuEtnrL9-H0',img:'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop'},
  { id:16, en:{title:'Local Storage & Session',desc:'Save data in the browser — persist hero progress between sessions.'},kz:{title:'Local Storage және Session',desc:'Деректерді браузерде сақтаңыз — сессиялар арасында прогресті сақтаңыз.'},category:'advanced',heroType:'mutation',video:'https://www.youtube.com/embed/AUOzvFzdIk4',img:'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=250&fit=crop'},
  { id:17, en:{title:'Error Handling & Debugging',desc:'Catch bugs like a detective — try/catch and debugging techniques.'},kz:{title:'Қателерді өңдеу мен жөндеу',desc:'Қателерді детектив сияқты табыңыз — try/catch және жөндеу техникалары.'},category:'advanced',heroType:'mutation',video:'https://www.youtube.com/embed/cFTFtuEQ-10',img:'https://images.unsplash.com/photo-1607799279861-4dd421887fc5?w=400&h=250&fit=crop'},
  { id:18, en:{title:'Classes & OOP',desc:'Build with blueprints — create classes and use object-oriented patterns.'},kz:{title:'Кластар мен ООП',desc:'Жоспарлармен құрыңыз — кластар жасаңыз және ОБП үлгілерін қолданыңыз.'},category:'advanced',heroType:'mutation',video:'https://www.youtube.com/embed/2ZphE5HcQPQ',img:'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=250&fit=crop'},
  { id:19, en:{title:'Modules: import / export',desc:'Organize your code into modules — teamwork makes the dream work.'},kz:{title:'Модульдер: import / export',desc:'Кодыңызды модульдерге бөліңіз — командалық жұмыс күшті.'},category:'advanced',heroType:'mutation',video:'https://www.youtube.com/embed/cRHQNNcYf6s',img:'https://images.unsplash.com/photo-1550439062-609e1531270e?w=400&h=250&fit=crop'},
  { id:20, en:{title:'Node.js Introduction',desc:'Take JavaScript to the server side — become a full-stack hero.'},kz:{title:'Node.js кіріспе',desc:'JavaScript-ті сервер жағына апарыңыз — толық стек батыр болыңыз.'},category:'advanced',heroType:'mutation',video:'https://www.youtube.com/embed/TlB_eWDSMt4',img:'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=400&h=250&fit=crop'}
];

const quizzes = [
  { courseId:1, questions:[
    {en:'What is JavaScript primarily used for?',kz:'JavaScript негізінен не үшін қолданылады?',options:['Styling web pages','Adding interactivity to websites','Database management','Operating system development'],correct:1},
    {en:'Where does JavaScript run?',kz:'JavaScript қайда жұмыс істейді?',options:['Only on servers','Only in browsers','In browsers and servers','Only in mobile apps'],correct:2},
    {en:'Which tag is used to include JavaScript in HTML?',kz:'HTML-де JavaScript қосу үшін қандай тег қолданылады?',options:['<js>','<javascript>','<script>','<code>'],correct:2},
    {en:'Who created JavaScript?',kz:'JavaScript-ті кім жасады?',options:['Tim Berners-Lee','Brendan Eich','James Gosling','Guido van Rossum'],correct:1}
  ]},
  { courseId:2, questions:[
    {en:'Which keyword declares a block-scoped variable?',kz:'Блок аумағындағы айнымалыны қай кілт сөз жариялайды?',options:['var','let','both var and let','none'],correct:1},
    {en:'What is the type of NaN?',kz:'NaN-ның түрі қандай?',options:['string','undefined','number','NaN'],correct:2},
    {en:'Which is NOT a primitive type?',kz:'Қайсысы қарапайым түр ЕМЕС?',options:['string','boolean','object','number'],correct:2},
    {en:'What does typeof null return?',kz:'typeof null не қайтарады?',options:['"null"','"undefined"','"object"','"boolean"'],correct:2}
  ]},
  { courseId:3, questions:[
    {en:'What does === check?',kz:'=== не тексереді?',options:['Only value','Only type','Value and type','Neither'],correct:2},
    {en:'What is 5 + "3" in JavaScript?',kz:'JavaScript-те 5 + "3" нәтижесі қандай?',options:['8','53','"53"','Error'],correct:2},
    {en:'Which is the logical AND operator?',kz:'Логикалық ЖӘНЕ операторы қайсы?',options:['||','&&','!','??'],correct:1},
    {en:'What does ++ do?',kz:'++ не істейді?',options:['Decrements by 1','Increments by 1','Multiplies by 2','Divides by 2'],correct:1}
  ]},
  { courseId:4, questions:[
    {en:'Which statement is used for multiple conditions?',kz:'Көптеген шарттар үшін қай оператор қолданылады?',options:['for','while','switch','do'],correct:2},
    {en:'What is the default case in switch?',kz:'Switch-те default case не?',options:['First case','Last case','Runs if no case matches','Required case'],correct:2},
    {en:'What does "else if" allow?',kz:'"else if" не мүмкіндік береді?',options:['Looping','Multiple conditions','Function calls','Variable declaration'],correct:1},
    {en:'Which value is falsy?',kz:'Қай мән falsy болады?',options:['1','"hello"','0','[]'],correct:2}
  ]},
  { courseId:5, questions:[
    {en:'Which loop runs at least once?',kz:'Қай цикл кем дегенде бір рет орындалады?',options:['for','while','do-while','for...in'],correct:2},
    {en:'What does "break" do in a loop?',kz:'"break" циклде не істейді?',options:['Skips iteration','Exits the loop','Restarts loop','Pauses loop'],correct:1},
    {en:'What does "continue" do?',kz:'"continue" не істейді?',options:['Exits loop','Skips to next iteration','Stops program','Restarts loop'],correct:1},
    {en:'for(let i=0; i<3; i++) — how many times?',kz:'for(let i=0; i<3; i++) — неше рет?',options:['2','3','4','1'],correct:1}
  ]},
  { courseId:6, questions:[
    {en:'What is a function?',kz:'Функция дегеніміз не?',options:['A variable','A reusable block of code','A loop','An HTML tag'],correct:1},
    {en:'What does "return" do?',kz:'"return" не істейді?',options:['Logs to console','Sends back a value','Declares variable','Creates loop'],correct:1},
    {en:'What is a parameter?',kz:'Параметр деген не?',options:['Return value','Input variable in function definition','A global variable','A constant'],correct:1},
    {en:'Can functions be stored in variables?',kz:'Функцияларды айнымалыларда сақтауға бола ма?',options:['No','Yes','Only arrow functions','Only named functions'],correct:1}
  ]},
  { courseId:7, questions:[
    {en:'How to add an item to end of array?',kz:'Массив соңына элемент қалай қосасыз?',options:['.pop()','.push()','.shift()','.unshift()'],correct:1},
    {en:'What does .filter() return?',kz:'.filter() не қайтарады?',options:['One item','A new filtered array','A boolean','undefined'],correct:1},
    {en:'What does .map() do?',kz:'.map() не істейді?',options:['Filters array','Transforms each element','Sorts array','Removes elements'],correct:1},
    {en:'How to get array length?',kz:'Массив ұзындығын қалай аласыз?',options:['.size()','.length','.count()','.total()'],correct:1}
  ]},
  { courseId:8, questions:[
    {en:'How to access object property?',kz:'Объект қасиетіне қалай қол жеткізесіз?',options:['obj->key','obj.key or obj["key"]','obj::key','obj(key)'],correct:1},
    {en:'What is JSON?',kz:'JSON дегеніміз не?',options:['A database','JavaScript Object Notation','A framework','A library'],correct:1},
    {en:'Which method converts JSON string to object?',kz:'JSON жолын объектіге қай әдіс түрлендіреді?',options:['JSON.stringify()','JSON.parse()','JSON.convert()','JSON.toObject()'],correct:1},
    {en:'What does Object.keys() return?',kz:'Object.keys() не қайтарады?',options:['Values array','Keys array','Boolean','Object copy'],correct:1}
  ]},
  { courseId:9, questions:[
    {en:'What does DOM stand for?',kz:'DOM не білдіреді?',options:['Document Object Model','Data Object Manager','Document Oriented Model','Dynamic Object Model'],correct:0},
    {en:'How to select element by ID?',kz:'ID бойынша элементті қалай таңдайсыз?',options:['querySelector()','getElementById()','getElementByClass()','findById()'],correct:1},
    {en:'What does innerHTML do?',kz:'innerHTML не істейді?',options:['Gets/sets CSS','Gets/sets HTML content','Gets/sets attributes','Removes element'],correct:1},
    {en:'How to create a new element?',kz:'Жаңа элемент қалай жасалады?',options:['document.createElement()','document.newElement()','document.make()','document.build()'],correct:0}
  ]},
  { courseId:10, questions:[
    {en:'What method adds an event listener?',kz:'Оқиға тыңдаушысын қай әдіс қосады?',options:['.onEvent()','.addEventListener()','.listenTo()','.attachEvent()'],correct:1},
    {en:'Which event fires on click?',kz:'Клик кезінде қай оқиға іске қосылады?',options:['onhover','click','press','activate'],correct:1},
    {en:'What is event.preventDefault()?',kz:'event.preventDefault() не?',options:['Stops propagation','Prevents default browser action','Removes event','Creates event'],correct:1},
    {en:'What is event bubbling?',kz:'Event bubbling дегеніміз не?',options:['Events go from parent to child','Events go from child to parent','Events are cancelled','Events are delayed'],correct:1}
  ]},
  { courseId:11, questions:[
    {en:'Correct arrow function syntax?',kz:'Дұрыс көрсеткі функция синтаксисі?',options:['=> function()','() => {}','function =>()','-> () {}'],correct:1},
    {en:'Do arrow functions have their own "this"?',kz:'Көрсеткі функцияларда өз "this" бар ма?',options:['Yes','No','Sometimes','Only in strict mode'],correct:1},
    {en:'Can arrow functions be used as constructors?',kz:'Көрсеткі функцияларды конструктор ретінде қолдануға бола ма?',options:['Yes','No','Only with new keyword','Only in classes'],correct:1},
    {en:'Shortest arrow function form?',kz:'Ең қысқа көрсеткі функция формасы?',options:['x => x * 2','(x) => { return x * 2 }','function(x) { return x*2 }','x -> x * 2'],correct:0}
  ]},
  { courseId:12, questions:[
    {en:'What does destructuring do?',kz:'Деструктуризация не істейді?',options:['Destroys variables','Unpacks values from arrays/objects','Creates arrays','Merges objects'],correct:1},
    {en:'What does the spread operator look like?',kz:'Spread оператор қалай көрінеді?',options:['**','...','::','>>'],correct:1},
    {en:'const [a, b] = [1, 2]; What is b?',kz:'const [a, b] = [1, 2]; b неге тең?',options:['1','2','undefined','[1,2]'],correct:1},
    {en:'What does ...rest do in function params?',kz:'Функция параметрлеріндегі ...rest не істейді?',options:['Spreads array','Collects remaining arguments','Creates object','Destroys array'],correct:1}
  ]},
  { courseId:13, questions:[
    {en:'What states can a Promise have?',kz:'Promise қандай күйлерде болады?',options:['start, end','pending, fulfilled, rejected','open, closed','active, inactive'],correct:1},
    {en:'Which method handles fulfilled promise?',kz:'Орындалған promise-ті қай әдіс өңдейді?',options:['.catch()','.then()','.finally()','.done()'],correct:1},
    {en:'Which method handles rejected promise?',kz:'Қабылданбаған promise-ті қай әдіс өңдейді?',options:['.then()','.catch()','.reject()','.error()'],correct:1},
    {en:'What does Promise.all() do?',kz:'Promise.all() не істейді?',options:['Runs one promise','Waits for all promises','Cancels promises','Creates promise'],correct:1}
  ]},
  { courseId:14, questions:[
    {en:'What does "async" keyword do?',kz:'"async" кілт сөзі не істейді?',options:['Makes function synchronous','Makes function return a Promise','Stops execution','Creates loop'],correct:1},
    {en:'What does "await" do?',kz:'"await" не істейді?',options:['Skips promise','Pauses until promise resolves','Creates promise','Rejects promise'],correct:1},
    {en:'Can you use await outside async function?',kz:'Await-ті async функциядан тыс қолдануға бола ма?',options:['Yes always','No (except top-level in modules)','Yes in any function','Only in loops'],correct:1},
    {en:'How to handle errors with async/await?',kz:'Async/await-пен қателерді қалай өңдейміз?',options:['if/else','.catch()','try/catch','switch/case'],correct:2}
  ]},
  { courseId:15, questions:[
    {en:'What does fetch() return?',kz:'fetch() не қайтарады?',options:['Data directly','A Promise','An array','A string'],correct:1},
    {en:'What method converts response to JSON?',kz:'Жауапты JSON-ға қай әдіс түрлендіреді?',options:['.json()','.toJSON()','.parse()','.convert()'],correct:0},
    {en:'What HTTP method is used to send data?',kz:'Деректерді жіберу үшін қай HTTP әдіс қолданылады?',options:['GET','POST','DELETE','FETCH'],correct:1},
    {en:'What is AJAX?',kz:'AJAX дегеніміз не?',options:['A framework','Asynchronous JS and XML','A database','A server'],correct:1}
  ]},
  { courseId:16, questions:[
    {en:'What does localStorage persist?',kz:'localStorage не сақтайды?',options:['Until tab closes','Until browser closes','Until manually cleared','For 24 hours'],correct:2},
    {en:'How to save data to localStorage?',kz:'localStorage-ға деректерді қалай сақтайсыз?',options:['localStorage.save()','localStorage.setItem()','localStorage.put()','localStorage.add()'],correct:1},
    {en:'What type does localStorage store?',kz:'localStorage қандай түрді сақтайды?',options:['Objects','Arrays','Strings only','Any type'],correct:2},
    {en:'How to remove one item?',kz:'Бір элементті қалай жоясыз?',options:['localStorage.delete()','localStorage.removeItem()','localStorage.clear()','localStorage.pop()'],correct:1}
  ]},
  { courseId:17, questions:[
    {en:'What does try/catch do?',kz:'try/catch не істейді?',options:['Creates errors','Handles runtime errors','Loops code','Defines variables'],correct:1},
    {en:'What keyword throws an error manually?',kz:'Қателікті қолмен қай кілт сөз шығарады?',options:['error','throw','catch','break'],correct:1},
    {en:'What is "finally" block for?',kz:'"finally" блогы не үшін?',options:['Only runs on error','Runs regardless of error','Replaces catch','Stops program'],correct:1},
    {en:'Which tool helps debug in browser?',kz:'Браузерде жөндеуге қай құрал көмектеседі?',options:['Terminal','DevTools Console','Text editor','File manager'],correct:1}
  ]},
  { courseId:18, questions:[
    {en:'What keyword creates a class?',kz:'Класс жасау үшін қай кілт сөз қолданылады?',options:['function','object','class','struct'],correct:2},
    {en:'What is the constructor method?',kz:'constructor әдісі не?',options:['Destroys object','Initializes object','Copies object','Validates object'],correct:1},
    {en:'What does "extends" do?',kz:'"extends" не істейді?',options:['Creates new class','Inherits from another class','Deletes class','Exports class'],correct:1},
    {en:'What does "super" keyword do?',kz:'"super" кілт сөзі не істейді?',options:['Creates new object','Calls parent constructor','Deletes parent','Exports parent'],correct:1}
  ]},
  { courseId:19, questions:[
    {en:'What does "export default" do?',kz:'"export default" не істейді?',options:['Imports module','Exports one main thing','Deletes module','Creates variable'],correct:1},
    {en:'How to import a named export?',kz:'Аталған экспортты қалай импорттайсыз?',options:['import x from','import { x } from','require(x)','include(x)'],correct:1},
    {en:'What file extension is needed for ES modules in Node?',kz:'Node-да ES модульдері үшін қандай файл кеңейтімі керек?',options:['.js','.mjs','.mod','.es'],correct:1},
    {en:'Can you have multiple named exports?',kz:'Бірнеше аталған экспорт бола ма?',options:['No','Yes','Only 2','Only in React'],correct:1}
  ]},
  { courseId:20, questions:[
    {en:'What is Node.js?',kz:'Node.js дегеніміз не?',options:['A browser','A JS runtime on server','A database','A CSS framework'],correct:1},
    {en:'Which module handles HTTP in Node.js?',kz:'Node.js-те HTTP-ні қай модуль өңдейді?',options:['fs','path','http','url'],correct:2},
    {en:'What is npm?',kz:'npm дегеніміз не?',options:['A browser','Node Package Manager','A compiler','A database'],correct:1},
    {en:'What does require() do?',kz:'require() не істейді?',options:['Creates file','Imports a module','Deletes module','Runs test'],correct:1}
  ]}
];

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
      videoId = parsed.pathname.replace('/', '').split('/')[0];
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    }
  } catch {
    return raw;
  }

  return raw;
}

function sanitizeCourse(raw, idx = 0) {
  const id = Number(raw.id) || Date.now() + idx;
  const fallbackImg = 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop';
  return {
    id,
    en: {
      title: raw?.en?.title || `Course ${id}`,
      desc: raw?.en?.desc || 'JavaScript learning module.',
    },
    kz: {
      title: raw?.kz?.title || `Курс ${id}`,
      desc: raw?.kz?.desc || 'JavaScript оқу модулі.',
    },
    category: raw.category || 'beginner',
    heroType: raw.heroType || 'tech',
    video: normalizeYouTubeEmbed(raw.video),
    img: raw.img || fallbackImg,
  };
}

const BONUS_QUESTIONS = [
  {
    en: 'Which habit improves JavaScript learning the fastest?',
    kz: 'JavaScript-ті тез меңгеруге қай әдет ең пайдалы?',
    options: ['Ignoring errors', 'Daily coding practice', 'Watching only theory', 'Skipping exercises'],
    correct: 1,
  },
  {
    en: 'Where can you track your quiz progress in this platform?',
    kz: 'Осы платформада тест прогресін қайдан көре аласыз?',
    options: ['Only in browser history', 'Only in Telegram', 'In saved score history', 'It is not saved'],
    correct: 2,
  },
];

function ensureBonusQuestions() {
  quizzes.forEach((quiz) => {
    BONUS_QUESTIONS.forEach((question) => {
      const exists = quiz.questions.some((q) => q.en === question.en);
      if (!exists) {
        quiz.questions.push({ ...question });
      }
    });
  });
}

function replaceArray(target, source, mapper = (item) => item) {
  target.splice(0, target.length, ...source.map(mapper));
}

function persistData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const payload = {
      users,
      reviews,
      scores,
      courses,
      quizzes,
      telemetry,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (error) {
    console.error('Persist error:', error.message);
  }
}

function loadPersistedData() {
  if (!fs.existsSync(DATA_FILE)) return;

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    if (Array.isArray(parsed.users)) {
      users = parsed.users;
    }
    if (Array.isArray(parsed.reviews)) {
      reviews = parsed.reviews;
    }
    if (Array.isArray(parsed.scores)) {
      scores = parsed.scores;
    }
    if (Array.isArray(parsed.courses) && parsed.courses.length) {
      replaceArray(courses, parsed.courses, sanitizeCourse);
    }
    if (Array.isArray(parsed.quizzes) && parsed.quizzes.length) {
      replaceArray(quizzes, parsed.quizzes);
    }
    if (parsed.telemetry && typeof parsed.telemetry === 'object') {
      telemetry = { ...telemetry, ...parsed.telemetry };
    }
  } catch (error) {
    console.error('Load persisted data error:', error.message);
  }
}

function buildAdminOverview() {
  const enrollmentCount = users.reduce((acc, user) => acc + (user.enrolledCourses?.length || 0), 0);
  const avgScore = scores.length
    ? Math.round(scores.reduce((sum, entry) => sum + entry.percentage, 0) / scores.length)
    : 0;

  const topCoursesMap = {};
  users.forEach((user) => {
    (user.enrolledCourses || []).forEach((courseId) => {
      topCoursesMap[courseId] = (topCoursesMap[courseId] || 0) + 1;
    });
  });

  const topCourses = Object.entries(topCoursesMap)
    .map(([courseId, enrolled]) => {
      const course = courses.find((c) => c.id === Number(courseId));
      return {
        courseId: Number(courseId),
        title: course ? course.en.title : `Course ${courseId}`,
        enrolled,
      };
    })
    .sort((a, b) => b.enrolled - a.enrolled)
    .slice(0, 5);

  const scorerMap = {};
  scores.forEach((entry) => {
    const key = entry.userName || 'Guest';
    if (!scorerMap[key]) {
      scorerMap[key] = { userName: key, attempts: 0, totalPercent: 0 };
    }
    scorerMap[key].attempts += 1;
    scorerMap[key].totalPercent += entry.percentage;
  });

  const topScorers = Object.values(scorerMap)
    .map((item) => ({
      userName: item.userName,
      attempts: item.attempts,
      avgPercentage: Math.round(item.totalPercent / item.attempts),
    }))
    .sort((a, b) => b.avgPercentage - a.avgPercentage)
    .slice(0, 10);

  return {
    stats: {
      users: users.length,
      courses: courses.length,
      scores: scores.length,
      reviews: reviews.length,
      enrollments: enrollmentCount,
      avgScore,
      telegramClicks: telemetry.telegramClicks || 0,
    },
    topCourses,
    topScorers,
    generatedAt: new Date().toISOString(),
  };
}

replaceArray(courses, courses, sanitizeCourse);
loadPersistedData();
replaceArray(courses, courses, sanitizeCourse);
ensureBonusQuestions();
persistData();
 
function sanitizeUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    enrolledCourses: user.enrolledCourses || [],
    registeredAt: user.registeredAt || user.createdAt || new Date().toISOString(),
  };
}

app.get('/api/users', (req, res) => res.json(users.map(sanitizeUserResponse)));

app.post('/api/register', (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  if (users.find((u) => String(u.email).toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const user = {
    id: Date.now(),
    name,
    phone,
    email: normalizedEmail,
    password,
    enrolledCourses: [],
    registeredAt: new Date().toISOString(),
  };
  users.push(user);
  persistData();

  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const user = users.find((u) => String(u.email).toLowerCase() === normalizedEmail && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.delete('/api/users/:id', (req, res) => {
  const id = Number(req.params.id);
  users = users.filter((u) => u.id !== id);
  scores = scores.filter((s) => s.userId !== id);
  persistData();
  res.json({ success: true });
});

app.get('/api/courses', (req, res) => res.json(courses.map(sanitizeCourse)));

app.post('/api/courses', (req, res) => {
  const course = sanitizeCourse({ id: Date.now(), ...req.body });
  courses.push(course);

  const quizExists = quizzes.some((q) => q.courseId === course.id);
  if (!quizExists) {
    quizzes.push({
      courseId: course.id,
      questions: [...BONUS_QUESTIONS.map((q) => ({ ...q }))],
    });
  }

  persistData();
  res.json({ success: true, course });
});

app.delete('/api/courses/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = courses.findIndex((c) => c.id === id);
  if (idx > -1) {
    courses.splice(idx, 1);
    const qIdx = quizzes.findIndex((q) => q.courseId === id);
    if (qIdx > -1) quizzes.splice(qIdx, 1);
    reviews = reviews.filter((r) => r.courseId !== id);
    scores = scores.filter((s) => s.courseId !== id);
    users = users.map((user) => ({
      ...user,
      enrolledCourses: (user.enrolledCourses || []).filter((courseId) => courseId !== id),
    }));
    persistData();
  }
  res.json({ success: true });
});

app.post('/api/enroll', (req, res) => {
  const { userId, courseId } = req.body;
  const user = users.find((u) => u.id === Number(userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const course = courses.find((c) => c.id === Number(courseId));
  if (!course) return res.status(404).json({ error: 'Course not found' });

  if (!Array.isArray(user.enrolledCourses)) {
    user.enrolledCourses = [];
  }

  if (!user.enrolledCourses.includes(course.id)) {
    user.enrolledCourses.push(course.id);
    persistData();
  }

  res.json({ success: true });
});

app.get('/api/reviews', (req, res) => {
  const courseId = req.query.courseId ? Number(req.query.courseId) : null;
  const filtered = courseId ? reviews.filter((r) => r.courseId === courseId) : reviews;
  res.json(filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
});

app.post('/api/reviews', (req, res) => {
  const { courseId, userName, text, rating } = req.body;
  if (!text || !userName) return res.status(400).json({ error: 'Text and name required' });

  const review = {
    id: Date.now(),
    courseId: courseId || null,
    userName,
    text,
    rating: rating || 5,
    createdAt: new Date().toISOString(),
  };

  reviews.push(review);
  persistData();
  res.json({ success: true, review });
});

app.get('/api/quizzes', (req, res) => res.json(quizzes));

app.get('/api/quizzes/:courseId', (req, res) => {
  const quiz = quizzes.find((q) => q.courseId === Number(req.params.courseId));
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  res.json(quiz);
});

app.get('/api/scores', (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : null;
  const filtered = userId ? scores.filter((s) => s.userId === userId) : scores;
  res.json(filtered);
});

app.post('/api/scores', (req, res) => {
  const { userId, userName, courseId, score, total } = req.body;
  const existing = scores.findIndex((s) => s.userId === userId && s.courseId === courseId);

  const entry = {
    userId,
    userName,
    courseId,
    score,
    total,
    percentage: Math.round((score / total) * 100),
    date: new Date().toISOString(),
  };

  if (existing > -1) scores[existing] = entry;
  else scores.push(entry);

  persistData();
  res.json({ success: true, entry });
});

app.post('/api/telemetry/telegram-click', (req, res) => {
  telemetry.telegramClicks = Number(telemetry.telegramClicks || 0) + 1;
  persistData();
  res.json({ success: true, telegramClicks: telemetry.telegramClicks });
});

app.get('/api/admin/overview', (req, res) => {
  res.json(buildAdminOverview());
});

app.get('/api/export/users', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 16 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Registered', key: 'registeredAt', width: 28 },
      { header: 'Enrolled Count', key: 'enrolled', width: 16 },
      { header: 'Enrolled IDs', key: 'enrolledIds', width: 30 },
    ];

    users.forEach((u) => {
      sheet.addRow({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        registeredAt: u.registeredAt || u.createdAt,
        enrolled: (u.enrolledCourses || []).length,
        enrolledIds: (u.enrolledCourses || []).join(', '),
      });
    });

    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

app.get('/api/export/full-report', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    const usersSheet = workbook.addWorksheet('Users');
    usersSheet.columns = [
      { header: 'ID', key: 'id', width: 16 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Registered', key: 'registeredAt', width: 28 },
      { header: 'Enrolled IDs', key: 'enrolledCourses', width: 30 },
    ];
    users.forEach((u) => usersSheet.addRow({ ...u, enrolledCourses: (u.enrolledCourses || []).join(', ') }));

    const coursesSheet = workbook.addWorksheet('Courses');
    coursesSheet.columns = [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'Title EN', key: 'titleEn', width: 35 },
      { header: 'Title KZ', key: 'titleKz', width: 35 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Hero Type', key: 'heroType', width: 16 },
      { header: 'Video', key: 'video', width: 50 },
    ];
    courses.forEach((c) =>
      coursesSheet.addRow({
        id: c.id,
        titleEn: c.en.title,
        titleKz: c.kz.title,
        category: c.category,
        heroType: c.heroType,
        video: c.video,
      }),
    );

    const scoresSheet = workbook.addWorksheet('Scores');
    scoresSheet.columns = [
      { header: 'User ID', key: 'userId', width: 14 },
      { header: 'User', key: 'userName', width: 24 },
      { header: 'Course ID', key: 'courseId', width: 14 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Percentage', key: 'percentage', width: 12 },
      { header: 'Date', key: 'date', width: 28 },
    ];
    scores.forEach((s) => scoresSheet.addRow(s));

    const reviewsSheet = workbook.addWorksheet('Reviews');
    reviewsSheet.columns = [
      { header: 'ID', key: 'id', width: 16 },
      { header: 'Course ID', key: 'courseId', width: 14 },
      { header: 'User', key: 'userName', width: 24 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Text', key: 'text', width: 60 },
      { header: 'Created At', key: 'createdAt', width: 28 },
    ];
    reviews.forEach((r) => reviewsSheet.addRow(r));

    const analyticsSheet = workbook.addWorksheet('Analytics');
    const overview = buildAdminOverview();
    analyticsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    Object.entries(overview.stats).forEach(([metric, value]) => {
      analyticsSheet.addRow({ metric, value });
    });

    res.setHeader('Content-Disposition', 'attachment; filename=jsha-full-report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export full report error:', error);
    res.status(500).json({ error: 'Failed to export full report' });
  }
});

app.get('/api/export/analytics.json', (req, res) => {
  res.json(buildAdminOverview());
});

function serveApp(req, res) {
  if (fs.existsSync(DIST_INDEX)) {
    return res.sendFile(DIST_INDEX);
  }
  return res.sendFile(VITE_INDEX);
}

const spaRoutes = ['/', '/courses', '/register', '/login', '/admin', '/contact', '/quiz'];
spaRoutes.forEach((route) => app.get(route, serveApp));
app.get('/course/:id', serveApp);

app.listen(PORT, () => {
  console.log(`JS Heroes Academy running at http://localhost:${PORT}`);

  try {
    const { startBot } = require('./bot.js');  
    startBot();
  } catch (err) {
    console.error("Ботты жүктеу қатесі:", err);
  }
});
