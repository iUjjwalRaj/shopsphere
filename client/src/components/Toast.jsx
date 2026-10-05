export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || 'success'}`}>
          <span className="toast-icon" aria-hidden="true">✓</span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
