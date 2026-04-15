// ---------------------------------------------------------------------------
// Domain models (mirror the DB schema)
// ---------------------------------------------------------------------------

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
  updated_at: string;
  /** Tags attached to this todo — populated by JOIN queries */
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TodoTag {
  todo_id: string;
  tag_id: string;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  /** Optional tag IDs to attach on creation */
  tag_ids?: string[];
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  due_date?: string | null;
  /** When provided, replaces all existing tag associations */
  tag_ids?: string[];
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Query / filter helpers
// ---------------------------------------------------------------------------

export interface TodoFilters {
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}
