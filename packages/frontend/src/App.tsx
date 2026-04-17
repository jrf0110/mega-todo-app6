import { useState, useEffect, useCallback } from "react";
import type { Todo, Tag, TodoFilters } from "./types";
import { fetchTodos, fetchTags } from "./api";
import { TodoItem } from "./components/TodoItem";
import { TodoForm } from "./components/TodoForm";
import { TagManager } from "./components/TagManager";
import { FilterBar } from "./components/FilterBar";

function DarkModeToggle({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

const PAGE_SIZE = 20;

function App() {
  // Dark mode
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [dark]);

  // Data state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TodoFilters>({ page: 1, limit: PAGE_SIZE });

  // Load tags once
  useEffect(() => {
    fetchTags().then((res) => {
      if (res.data) setTags(res.data);
    });
  }, []);

  // Load todos on filter change
  const loadTodos = useCallback(async (f: TodoFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTodos(f);
      if (res.error) {
        setError(res.error);
        return;
      }
      setTodos(res.data);
      setTotalCount(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTodos(filters);
  }, [filters, loadTodos]);

  // Handlers
  function handleFiltersChange(next: TodoFilters) {
    setFilters(next);
  }

  function handlePageChange(page: number) {
    setFilters((f) => ({ ...f, page }));
  }

  function handleTodoCreated(todo: Todo) {
    // Refresh the list so ordering and filters are respected
    void loadTodos(filters);
    // Optimistically prepend if on page 1 with no filters that would hide it
    if ((filters.page ?? 1) === 1) {
      setTodos((prev) => [todo, ...prev]);
      setTotalCount((c) => c + 1);
    }
  }

  function handleTodoUpdated(updated: Todo) {
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleTodoDeleted(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));
  }

  function handleTagsChanged(updated: Tag[]) {
    setTags(updated);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mega Todo</h1>
          </div>
          <DarkModeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Tag Manager */}
        <TagManager tags={tags} onTagsChanged={handleTagsChanged} />

        {/* Add Todo Form */}
        <TodoForm tags={tags} onCreated={handleTodoCreated} />

        {/* Filters */}
        <FilterBar
          filters={filters}
          tags={tags}
          totalCount={totalCount}
          onFiltersChange={handleFiltersChange}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
              <button
                onClick={() => void loadTodos(filters)}
                className="ml-auto text-xs underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && todos.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {filters.completed !== undefined ||
              filters.priority !== undefined ||
              filters.tag ||
              filters.search
                ? "No todos match your filters."
                : "No todos yet. Add one above!"}
            </p>
          </div>
        )}

        {/* Todo list */}
        {!loading && todos.length > 0 && (
          <div className="space-y-2">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                allTags={tags}
                onUpdated={handleTodoUpdated}
                onDeleted={handleTodoDeleted}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={filters.page ?? 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  );
}

export default App;
