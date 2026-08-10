import { useEffect, useRef } from 'react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  tone = 'primary',
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink-950/50" onClick={onCancel} aria-hidden="true" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="card relative w-full max-w-sm p-6 outline-none"
      >
        <h2 id="confirm-dialog-title" className="mb-2 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
          {title}
        </h2>
        <p className="mb-6 text-sm text-ink-500 dark:text-ink-400">{message}</p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
