/**
 * Label + input + inline error, in one place so every form (not just auth)
 * gets the same validation-display behavior: error text appears only after
 * the field has been touched, announced via aria-invalid/aria-describedby
 * for screen readers.
 */
export function FormField({
  id,
  label,
  error,
  touched,
  hint,
  children,
  ...inputProps
}) {
  const showError = touched && error;

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children ? (
        children
      ) : (
        <input
          id={id}
          className="input"
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...inputProps}
        />
      )}
      {showError ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
