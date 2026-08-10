import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 dark:bg-paper-dark">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 font-display text-xl font-semibold text-white">
            E
          </span>
          <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">
            ExamQuiz <span className="text-brand-600 dark:text-brand-400">AI</span>
          </h1>
        </div>
        <div className="card p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
