import Button from './Button';

export default function Header({ lang, onToggleLang, enrolledCount }) {
  return (
    <header className="header">
      <div className="logo">JS HEROES ACADEMY</div>
      <div className="header-actions">
        <span className="pill">
          {lang === 'en' ? `Enrolled: ${enrolledCount}` : `Жазылған: ${enrolledCount}`}
        </span>
        <Button onClick={onToggleLang} variant="secondary">
          {lang === 'en' ? 'Қазақша' : 'English'}
        </Button>
      </div>
    </header>
  );
}
