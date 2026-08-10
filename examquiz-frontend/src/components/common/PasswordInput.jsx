import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({ id, className = '', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} className={`input pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
