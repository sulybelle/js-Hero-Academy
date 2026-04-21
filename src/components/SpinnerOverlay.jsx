export default function SpinnerOverlay({ visible, text }) {
  if (!visible) return null;
  return (
    <div className="spinner-overlay" role="status" aria-live="polite">
      <div className="spinner-container">
        <div className="spinner" />
        {text && <span className="spinner-text">{text}</span>}
      </div>
    </div>
  );
}
