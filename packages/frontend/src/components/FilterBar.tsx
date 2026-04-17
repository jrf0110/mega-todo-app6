import type { Tag, TodoFilters } from "../types";

interface FilterBarProps {
  filters: TodoFilters;
  tags: Tag[];
  totalCount: number;
  onFiltersChange: (filters: TodoFilters) => void;
}

export function FilterBar({ filters, tags, totalCount, onFiltersChange }: FilterBarProps) {
  function update(patch: Partial<TodoFilters>) {
    onFiltersChange({ ...filters, ...patch, page: 1 });
  }

  const hasActiveFilters =
    filters.completed !== undefined ||
    filters.priority !== undefined ||
    filters.tag !== undefined ||
    (filters.search && filters.search.length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search todos…"
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value || undefined })}
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
          {(["all", "active", "completed"] as const).map((s) => {
            const active =
              s === "all"
                ? filters.completed === undefined
                : s === "active"
                ? filters.completed === false
                : filters.completed === true;
            return (
              <button
                key={s}
                onClick={() =>
                  update({
                    completed:
                      s === "all" ? undefined : s === "active" ? false : true,
                  })
                }
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  active
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Priority */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Priority:</span>
          {(["all", "low", "medium", "high"] as const).map((p) => {
            const active =
              p === "all" ? filters.priority === undefined : filters.priority === p;
            const colorMap = {
              all: "",
              low: "bg-green-100 border-green-400 text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-200",
              medium: "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200",
              high: "bg-red-100 border-red-400 text-red-800 dark:bg-red-900 dark:border-red-600 dark:text-red-200",
            };
            return (
              <button
                key={p}
                onClick={() =>
                  update({ priority: p === "all" ? undefined : p })
                }
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  active && p !== "all"
                    ? colorMap[p]
                    : active && p === "all"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">Tag:</span>
            <button
              onClick={() => update({ tag: undefined })}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                filters.tag === undefined
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"
              }`}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() =>
                  update({ tag: filters.tag === tag.name ? undefined : tag.name })
                }
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  filters.tag === tag.name
                    ? "text-white border-transparent"
                    : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400"
                }`}
                style={
                  filters.tag === tag.name
                    ? { backgroundColor: tag.color, borderColor: tag.color }
                    : {}
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({ page: 1, limit: filters.limit })
            }
            className="ml-auto text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      <div className="text-xs text-gray-400 dark:text-gray-500">
        {totalCount} todo{totalCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
