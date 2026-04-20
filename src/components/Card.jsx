import Button from './Button';

export default function Card({ course, lang, onEnroll }) {
  const title = lang === 'en' ? course.titleEn : course.titleKz;
  const description = lang === 'en' ? course.descEn : course.descKz;

  return (
    <article className="card">
      <span className="card-level">{course.level}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Button onClick={() => onEnroll(course)}>
        {lang === 'en' ? 'Enroll' : 'Жазылу'}
      </Button>
    </article>
  );
}
