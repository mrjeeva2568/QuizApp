export function WelcomeBanner({ name }) {
  const firstName = name?.split(' ')[0] || 'there';
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
        Here&apos;s how your quiz practice is going.
      </p>
    </div>
  );
}
