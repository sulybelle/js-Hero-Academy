import { useApp } from '../context/AppContext';

const COLORS = {
  success: '#10b981',
  error: '#ef4444',
  info: '#8b5cf6',
  warning: '#f59e0b',
};

const ICONS = {
  success: '✅',
  error: '❌',
  info: '⚡',
  warning: '⚠️',
};

export default function ToastContainer() {
  const { toasts } = useApp();

  if (!toasts.length) {
    return null;
  }

  return (
    <div id="toast-container" className="toast-container-react">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-react"
          style={{ borderColor: COLORS[toast.type] || COLORS.info }}
        >
          <span>{ICONS[toast.type] || ICONS.info}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
