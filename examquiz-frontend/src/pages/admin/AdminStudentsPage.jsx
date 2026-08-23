import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/apiClient';
import { useDebounce } from '../../hooks/useDebounce';
import { ScoreRing } from '../../components/common/ScoreRing';
import { Spinner } from '../../components/common/Spinner';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

const PAGE_SIZE = 10;

function StatusBadge({ enabled }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        enabled
          ? 'bg-success-50 text-success-600 dark:bg-success-500/10'
          : 'bg-danger-50 text-danger-600 dark:bg-danger-500/10'
      }`}
    >
      {enabled ? 'Active' : 'Disabled'}
    </span>
  );
}

function StatusToggleButton({ student, isUpdating, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(student)}
      disabled={isUpdating}
      className={student.enabled ? 'btn-danger' : 'btn-primary'}
    >
      {isUpdating ? (
        <Spinner size="sm" className="border-white border-t-transparent" />
      ) : student.enabled ? (
        'Disable'
      ) : (
        'Enable'
      )}
    </button>
  );
}

function DeleteButton({ student, isDeleting, onDelete, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => onDelete(student)}
      disabled={isDeleting}
      className={`btn-danger ${className}`}
    >
      {isDeleting ? <Spinner size="sm" className="border-white border-t-transparent" /> : 'Delete'}
    </button>
  );
}

export function AdminStudentsPage() {
  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Debounced so typing doesn't fire a request per keystroke - search-as-you-type
  // without a "Search" button to click, but without hammering the backend either.
  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');
    adminService
      .getStudents({
        search: debouncedSearch,
        enabled: enabledFilter === 'all' ? undefined : enabledFilter === 'true',
        page,
        size: PAGE_SIZE,
      })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load students.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, enabledFilter, page]);

  // Any filter change resets to page 0 - staying on page 3 of a now-shorter
  // result set would just show an empty/confusing page.
  function handleSearchChange(event) {
    setSearch(event.target.value);
    setPage(0);
  }

  function handleFilterChange(event) {
    setEnabledFilter(event.target.value);
    setPage(0);
  }

  async function toggleStatus(student) {
    setUpdatingId(student.id);
    try {
      const updated = await adminService.updateStudentStatus(student.id, !student.enabled);
      setData((prev) => {
        const matchesFilter =
          enabledFilter === 'all' || String(updated.enabled) === enabledFilter;
        const content = matchesFilter
          ? prev.content.map((s) => (s.id === updated.id ? updated : s))
          : prev.content.filter((s) => s.id !== updated.id);

        return {
          ...prev,
          content,
          totalElements: matchesFilter ? prev.totalElements : prev.totalElements - 1,
        };
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update that student.'));
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmDelete() {
    if (!studentToDelete) return;
    setDeletingId(studentToDelete.id);
    try {
      await adminService.deleteStudent(studentToDelete.id);
      setData((prev) => ({
        ...prev,
        content: prev.content.filter((s) => s.id !== studentToDelete.id),
        totalElements: prev.totalElements - 1,
      }));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete that student.'));
    } finally {
      setDeletingId(null);
      setStudentToDelete(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Students</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Search, filter, and manage student accounts.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by name or email"
            className="input pl-9"
            value={search}
            onChange={handleSearchChange}
            aria-label="Search students by name or email"
          />
        </div>
        <select
          className="input w-auto"
          value={enabledFilter}
          onChange={handleFilterChange}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="true">Active only</option>
          <option value="false">Disabled only</option>
        </select>
      </div>

      <div className="mt-6 card overflow-hidden">
        {error && <p className="p-5 text-sm text-danger-600">{error}</p>}

        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!isLoading && data && data.content.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-400">No students found.</p>
        )}

        {!isLoading && data && data.content.length > 0 && (
          <>
            {/* Desktop/tablet: full table. A 5-column table on a 375px phone
                screen just overflows unreadably - not wrapped in overflow-x-auto
                as a band-aid, but replaced outright below md with a stacked
                card list carrying the same information. */}
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-ink-800">
                  <tr>
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">Attempts</th>
                    <th className="px-5 py-3 font-medium">Avg. score</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {data.content.map((student) => (
                    <tr key={student.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink-900 dark:text-ink-50">{student.fullName}</p>
                        <p className="text-xs text-ink-400">{student.email}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-ink-700 dark:text-ink-200">
                        {student.totalAttempts}
                      </td>
                      <td className="px-5 py-3">
                        <ScoreRing percentage={student.averageScorePercentage} size={36} strokeWidth={4} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge enabled={student.enabled} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <StatusToggleButton
                          student={student}
                          isUpdating={updatingId === student.id}
                          onToggle={toggleStatus}
                        />
                        <DeleteButton
                          student={student}
                          isDeleting={deletingId === student.id}
                          onDelete={setStudentToDelete}
                          className="ml-2"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards, same data and actions as the table. */}
            <div className="divide-y divide-ink-100 dark:divide-ink-800 md:hidden">
              {data.content.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-4">
                  <ScoreRing percentage={student.averageScorePercentage} size={44} strokeWidth={4} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-900 dark:text-ink-50">{student.fullName}</p>
                    <p className="truncate text-xs text-ink-400">{student.email}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge enabled={student.enabled} />
                      <span className="font-mono text-xs text-ink-500 dark:text-ink-400">
                        {student.totalAttempts} attempts
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <StatusToggleButton
                      student={student}
                      isUpdating={updatingId === student.id}
                      onToggle={toggleStatus}
                    />
                    <DeleteButton
                      student={student}
                      isDeleting={deletingId === student.id}
                      onDelete={setStudentToDelete}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              isLast={data.last}
              onPrevious={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              className="border-t border-ink-100 px-5 py-4 dark:border-ink-800"
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(studentToDelete)}
        title="Delete student account?"
        message={`This permanently deletes ${studentToDelete?.fullName}'s account and all their quiz attempts. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setStudentToDelete(null)}
        tone="danger"
      />
    </div>
  );
}