export default function SpinnerOverlay({ visible }) {
  if (!visible) return null;

  return (
    <div className="spinner-overlay-react">
      <div className="spinner-react" />
    </div>
  );
}
