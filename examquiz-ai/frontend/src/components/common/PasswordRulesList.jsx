import { Check, X } from 'lucide-react';
import { getPasswordRules } from '../../utils/validators';

/**
 * Live checklist against the backend's password policy. Only rendered once
 * the user has started typing a password - showing it empty/all-red before
 * any input is just noise.
 */
export function PasswordRulesList({ password }) {
  const rules = getPasswordRules(password);

  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
      {rules.map((rule) => (
        <li
          key={rule.key}
          className={`flex items-center gap-1.5 text-xs ${
            rule.met ? 'text-success-600' : 'text-ink-400'
          }`}
        >
          {rule.met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
