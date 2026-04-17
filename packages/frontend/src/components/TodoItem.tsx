import { useState } from "react";
import type { Todo, Tag, UpdateTodoInput } from "../types";
import { toggleTodo, deleteTodo, updateTodo, attachTag, detachTag } from "../api";

interface TodoItemProps {
  todo: Todo;
  allTags: Tag[];
  onUpdated: (todo: Todo) => void;
  onDeleted: (id: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function TodoItem({ todo, allTags, onUpdated, onDeleted }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description ?? "");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">(todo.priority);
  const [editDueDate, setEditDueDate] = useState(todo.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);

  const isOverdue =
    todo.due_date &&
    !todo.completed &&
    new Date(todo.due_date) < new Date(new Date().toISOString().slice(0, 10));

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await toggleTodo(todo.id);
      if (res.data) onUpdated(res.data);
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${todo.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteTodo(todo.id);
      onDeleted(todo.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const input: UpdateTodoInput = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        priority: editPriority,
        due_date: editDueDate || null,
      };
      const res = await updateTodo(todo.id, input);
      if (res.data) {
        onUpdated(res.data);
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? "");
    setEditPriority(todo.priority);
    setEditDueDate(todo.due_date ?? "");
    setIsEditing(false);
  }

  async function handleTagToggle(tagId: string) {
    const hasTag = todo.tags.some((t) => t.id === tagId);
    setTagLoading(true);
    try {
      const res = hasTag
        ? await detachTag(todo.id, tagId)
        : await attachTag(todo.id, tagId);
      if (res.data) onUpdated(res.data);
    } finally {
      setTagLoading(false);
    }
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-opacity ${
        todo.completed ? "opacity-60" : ""
      } ${deleting ? "opacity-30" : ""} border-gray-200 dark:border-gray-700`}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            todo.completed
              ? "bg-blue-500 border-blue-500 text-white"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
          }`}
          aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
        >
          {todo.completed ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2 flex-wrap">
                <select
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as "low" | "medium" | "high")
                  }
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center flex-wrap gap-2">
                <span
                  className={`text-sm font-medium text-gray-900 dark:text-white ${
                    todo.completed ? "line-through" : ""
                  }`}
                >
                  {todo.title}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    PRIORITY_STYLES[todo.priority]
                  }`}
                >
                  {todo.priority}
                </span>
                {todo.due_date && (
                  <span
                    className={`text-xs ${
                      isOverdue
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {isOverdue ? "⚠ " : ""}Due {todo.due_date}
                  </span>
                )}
              </div>

              {todo.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {todo.description}
                </p>
              )}

              {/* Tags */}
              {todo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {todo.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
              title="Manage tags"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors disabled:opacity-50"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Tag assignment panel */}
      {isExpanded && !isEditing && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Tags {tagLoading && <span className="ml-1 text-blue-500">…</span>}
          </p>
          {allTags.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">No tags yet. Create some in Tag Manager.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const active = todo.tags.some((t) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    disabled={tagLoading}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                      active
                        ? "text-white border-transparent"
                        : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    }`}
                    style={active ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                  >
                    {active ? "✓ " : ""}{tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
