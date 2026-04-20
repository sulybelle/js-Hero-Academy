export default function Footer({ lang }) {
  return (
    <footer className="footer">
      <p>
        {lang === 'en'
          ? 'JS Heroes Academy | React Lab 4'
          : 'JS Heroes Academy | React 4-зертханалық жұмыс'}
      </p>
    </footer>
  );
}
