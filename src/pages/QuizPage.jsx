import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function QuizPage({ courseFromQuery }) {
  const { lang, user, showToast, saveProgress } = useApp();
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [userScores, setUserScores] = useState({});

  const [mode, setMode] = useState('test');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizState, setQuizState] = useState('select'); // select | test | flashcard | result
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [fcIndex, setFcIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const activeCourse = useMemo(() => {
    if (!currentQuiz) return null;
    return allCourses.find((course) => course.id === currentQuiz.courseId) || null;
  }, [currentQuiz, allCourses]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [quizzes, courses, scores] = await Promise.all([
          api.getQuizzes(),
          api.getCourses(),
          api.getScores(),
        ]);

        if (!mounted) return;

        setAllQuizzes(quizzes);
        setAllCourses(courses);

        const map = {};
        scores.forEach((entry) => {
          map[entry.courseId] = entry;
        });
        setUserScores(map);

        if (courseFromQuery) {
          const initialQuiz = quizzes.find((q) => q.courseId === courseFromQuery);
          if (initialQuiz) {
            startQuiz(initialQuiz.courseId, initialQuiz, courses);
          }
        }
      } catch {
        if (mounted) {
          setAllQuizzes([]);
          setAllCourses([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [courseFromQuery]);

  const getCourseTitle = (courseId, coursesArg) => {
    const courses = coursesArg || allCourses;
    const course = courses.find((item) => item.id === courseId);
    if (!course) return '';
    return lang === 'kz' ? course.kz.title : course.en.title;
  };

  const startQuiz = (courseId, quizArg, coursesArg) => {
    const found = quizArg || allQuizzes.find((q) => q.courseId === courseId);
    if (!found) return;

    setCurrentQuiz(found);

    const title = getCourseTitle(courseId, coursesArg);
    saveProgress({ lastQuizCourse: title, lastQuizId: courseId });

    if (mode === 'test') {
      setQuizState('test');
      setQIndex(0);
      setScore(0);
      setSelected(null);
      showToast(lang === 'kz' ? 'Тест басталды! 🎯' : 'Quiz started! 🎯', 'success');
    } else {
      setQuizState('flashcard');
      setFcIndex(0);
      showToast(lang === 'kz' ? 'Карточкалар ашылды 🃏' : 'Flashcards opened 🃏', 'info');
    }
  };

  const currentQuestion = currentQuiz?.questions[qIndex] || null;
  const answered = selected !== null;
  const progressWidth = currentQuiz ? `${(qIndex / currentQuiz.questions.length) * 100}%` : '0%';

  const selectAnswer = (optionIndex) => {
    if (!currentQuestion || answered) return;

    setSelected(optionIndex);

    if (optionIndex === currentQuestion.correct) {
      showToast(lang === 'kz' ? 'Дұрыс!' : 'Correct!', 'success');
    } else {
      showToast(lang === 'kz' ? 'Қате!' : 'Wrong!', 'error');
    }
  };

  const nextQuestion = async () => {
    if (!currentQuiz) return;
    const gotPoint = selected === currentQuestion.correct;
    const nextScore = score + (gotPoint ? 1 : 0);

    if (qIndex + 1 < currentQuiz.questions.length) {
      setScore(nextScore);
      setQIndex((prev) => prev + 1);
      setSelected(null);
      return;
    }

    const finalScore = nextScore;
    const total = currentQuiz.questions.length;
    const percentage = Math.round((finalScore / total) * 100);

    setScore(nextScore);
    setQuizState('result');

    const grade = percentage >= 80 ? '🏆 S' : percentage >= 60 ? '⭐ A' : percentage >= 40 ? '👍 B' : '📚 C';
    saveProgress({
      lastQuizScore: percentage,
      lastQuizGrade: grade,
      quizCompleted: true,
      [`quiz_${currentQuiz.courseId}`]: percentage,
    });

    showToast(
      lang === 'kz' ? `Нәтиже: ${percentage}% ${grade}` : `Score: ${percentage}% ${grade}`,
      percentage >= 60 ? 'success' : 'warning',
    );

    try {
      const payload = {
        userId: user ? user.id : 0,
        userName: user ? user.name : 'Guest',
        courseId: currentQuiz.courseId,
        score: finalScore,
        total,
      };
      const response = await api.addScore(payload);
      if (response?.entry) {
        setUserScores((prev) => ({ ...prev, [response.entry.courseId]: response.entry }));
      }
    } catch {
      // ignore network errors
    }
  };

  const retryQuiz = () => {
    if (!currentQuiz) return;
    setQuizState('test');
    setQIndex(0);
    setScore(0);
    setSelected(null);
    showToast(lang === 'kz' ? 'Тест қайта басталды!' : 'Quiz restarted!', 'info');
  };

  const backToSelect = () => {
    setQuizState('select');
    setCurrentQuiz(null);
    setSelected(null);
  };

  const currentFlashcard = currentQuiz?.questions[fcIndex] || null;
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [fcIndex, currentQuiz, lang]);

  if (loading) {
    return (
      <main>
        <div className="quiz-header">
          <h1>Loading...</h1>
        </div>
      </main>
    );
  }

  const finalScoreValue = (() => {
    if (!currentQuiz || quizState !== 'result') return 0;
    const total = currentQuiz.questions.length;
    return Math.round((score / total) * 100);
  })();

  const finalGrade = finalScoreValue >= 80 ? '🏆 S' : finalScoreValue >= 60 ? '⭐ A' : finalScoreValue >= 40 ? '👍 B' : '📚 C';
  const finalCorrect = currentQuiz ? score : 0;

  return (
    <main>
      <div className="quiz-header">
        <h1>
          {lang === 'kz' ? (
            <>
              БІЛІМ <span>АРЕНАСЫ</span>
            </>
          ) : (
            <>
              KNOWLEDGE <span>ARENA</span>
            </>
          )}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {lang === 'kz'
            ? 'Батыр қабілеттеріңізді тексеріңіз — кеңейтілген тесттер әр видеосабаққа сәйкес'
            : 'Test your hero abilities with expanded quizzes for every video lesson'}
        </p>
        <div className="quiz-modes" id="modeButtons">
          <button
            className={mode === 'test' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => {
              setMode('test');
              showToast(lang === 'kz' ? 'Тест режимі' : 'Test mode', 'info');
            }}
          >
            🎯 {lang === 'kz' ? 'Тест режимі' : 'Test Mode'}
          </button>
          <button
            className={mode === 'flashcard' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => {
              setMode('flashcard');
              showToast(lang === 'kz' ? 'Карточка режимі' : 'Flashcard mode', 'info');
            }}
          >
            🃏 {lang === 'kz' ? 'Карточкалар' : 'Flashcards'}
          </button>
        </div>
      </div>

      {quizState === 'select' && (
        <div className="quiz-select" id="quizSelect">
          <div className="quiz-card-grid" id="quizGrid">
            {allQuizzes.map((quiz) => {
              const scoreEntry = userScores[quiz.courseId];
              return (
                <div key={quiz.courseId} className="quiz-card" onClick={() => startQuiz(quiz.courseId)}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                  <h4>{getCourseTitle(quiz.courseId)}</h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {quiz.questions.length} {lang === 'kz' ? 'сұрақ' : 'questions'}
                  </div>
                  {scoreEntry ? (
                    <div className="score-badge">{scoreEntry.percentage}% ✦</div>
                  ) : (
                    <div className="score-badge" style={{ color: 'var(--text-muted)' }}>
                      —
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {quizState === 'test' && currentQuiz && currentQuestion && (
        <div className="quiz-area" id="quizArea" style={{ display: 'block' }}>
          <div style={{ marginBottom: '16px' }}>
            <button className="btn btn-secondary btn-sm" onClick={backToSelect}>
              ← {lang === 'kz' ? 'Артқа' : 'Back'}
            </button>
            <span id="quizTitle" style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', marginLeft: '12px' }}>
              {activeCourse ? (lang === 'kz' ? activeCourse.kz.title : activeCourse.en.title) : ''}
            </span>
          </div>

          <div className="quiz-progress">
            <span>
              {lang === 'kz' ? 'Сұрақ' : 'Question'} <strong id="qNum">{qIndex + 1}</strong> /{' '}
              <strong id="qTotal">{currentQuiz.questions.length}</strong>
            </span>
            <span id="qScore" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {score + (answered && selected === currentQuestion.correct ? 1 : 0)} pts
            </span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" id="progressFill" style={{ width: progressWidth }} />
          </div>

          <div id="questionContainer">
            <div className="quiz-question">
              <h3>{lang === 'kz' ? currentQuestion.kz : currentQuestion.en}</h3>
              <div className="quiz-options">
                {currentQuestion.options.map((option, idx) => {
                  let className = 'quiz-option';
                  if (answered && idx === currentQuestion.correct) className += ' correct';
                  if (answered && idx === selected && idx !== currentQuestion.correct) className += ' wrong';

                  return (
                    <div
                      key={idx}
                      className={className}
                      onClick={() => selectAnswer(idx)}
                      style={{ pointerEvents: answered ? 'none' : 'auto' }}
                    >
                      <span className="option-letter">{LETTERS[idx] || idx + 1}</span>
                      <span>{option}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn btn-primary btn-sm" id="nextBtn" onClick={nextQuestion} style={{ display: answered ? 'inline-flex' : 'none' }}>
              {qIndex + 1 >= currentQuiz.questions.length
                ? lang === 'kz'
                  ? 'Нәтиже'
                  : 'Result'
                : lang === 'kz'
                  ? 'Келесі'
                  : 'Next'}{' '}
              →
            </button>
          </div>
        </div>
      )}

      {quizState === 'flashcard' && currentQuiz && currentFlashcard && (
        <div className="flashcard-area" id="flashcardArea" style={{ display: 'block' }}>
          <div style={{ marginBottom: '16px' }}>
            <button className="btn btn-secondary btn-sm" onClick={backToSelect}>
              ← {lang === 'kz' ? 'Артқа' : 'Back'}
            </button>
            <span id="fcTitle" style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', marginLeft: '12px' }}>
              {activeCourse ? (lang === 'kz' ? activeCourse.kz.title : activeCourse.en.title) : ''}
            </span>
          </div>

          <div className="quiz-progress">
            <span>
              {lang === 'kz' ? 'Карточка' : 'Card'} <strong id="fcNum">{fcIndex + 1}</strong> /{' '}
              <strong id="fcTotal">{currentQuiz.questions.length}</strong>
            </span>
          </div>

          <div className={`flashcard ${flipped ? 'flipped' : ''}`} id="flashcard" onClick={() => setFlipped((prev) => !prev)}>
            <h3 id="fcQuestion">{lang === 'kz' ? currentFlashcard.kz : currentFlashcard.en}</h3>
            <div className="answer" id="fcAnswer">
              {currentFlashcard.options[currentFlashcard.correct]}
            </div>
            <p className="flip-hint">{lang === 'kz' ? 'Жауапты көру үшін басыңыз' : 'Click to reveal answer'}</p>
          </div>

          <div className="flashcard-nav">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFcIndex((prev) => (prev > 0 ? prev - 1 : prev))}
            >
              ← {lang === 'kz' ? 'Алдыңғы' : 'Prev'}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                setFcIndex((prev) => {
                  if (prev < currentQuiz.questions.length - 1) return prev + 1;
                  showToast(lang === 'kz' ? 'Соңғы карточка' : 'Last card', 'warning');
                  return prev;
                })
              }
            >
              {lang === 'kz' ? 'Келесі' : 'Next'} →
            </button>
          </div>
        </div>
      )}

      {quizState === 'result' && currentQuiz && (
        <div className="quiz-result" id="quizResult" style={{ display: 'block', maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
          <h2>
            {lang === 'kz' ? (
              <>
                МИССИЯ <span style={{ color: 'var(--accent)' }}>АЯҚТАЛДЫ</span>
              </>
            ) : (
              <>
                MISSION <span style={{ color: 'var(--accent)' }}>COMPLETE</span>
              </>
            )}
          </h2>
          <div className="score-big" id="resultScore">
            {finalScoreValue}%
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} id="resultText">
            {lang === 'kz'
              ? `${currentQuiz.questions.length} сұрақтан ${finalCorrect} дұрыс жауап`
              : `${finalCorrect} correct out of ${currentQuiz.questions.length} questions`}
          </p>

          <div
            id="resultDetail"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-solid)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>{finalCorrect}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lang === 'kz' ? 'ДҰРЫС' : 'CORRECT'}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--danger)' }}>
                  {currentQuiz.questions.length - finalCorrect}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lang === 'kz' ? 'ҚАТЕ' : 'WRONG'}</div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  gridColumn: 'span 2',
                }}
              >
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>{finalGrade}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lang === 'kz' ? 'БАҒА' : 'GRADE'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={retryQuiz}>
              {lang === 'kz' ? 'Қайталау' : 'Retry'}
            </button>
            <button className="btn btn-secondary" onClick={backToSelect}>
              {lang === 'kz' ? 'Барлық тесттер' : 'All Quizzes'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
