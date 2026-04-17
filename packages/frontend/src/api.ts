import type {
  Todo,
  Tag,
  CreateTodoInput,
  UpdateTodoInput,
  CreateTagInput,
  UpdateTagInput,
  ApiResponse,
  PaginatedResponse,
  TodoFilters,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json() as T;
  return json;
}

// ---------------------------------------------------------------------------
// Todos
// ---------------------------------------------------------------------------

export async function fetchTodos(
  filters: TodoFilters = {}
): Promise<PaginatedResponse<Todo>> {
  const params = new URLSearchParams();
  if (filters.completed !== undefined)
    params.set("completed", String(filters.completed));
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.search) params.set("search", filters.search);
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));

  const qs = params.toString();
  return request<PaginatedResponse<Todo>>(
    `/api/todos${qs ? `?${qs}` : ""}`
  );
}

export async function createTodo(
  input: CreateTodoInput
): Promise<ApiResponse<Todo>> {
  return request<ApiResponse<Todo>>("/api/todos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTodo(
  id: string,
  input: UpdateTodoInput
): Promise<ApiResponse<Todo>> {
  return request<ApiResponse<Todo>>(`/api/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteTodo(id: string): Promise<void> {
  await request<void>(`/api/todos/${id}`, { method: "DELETE" });
}

export async function toggleTodo(id: string): Promise<ApiResponse<Todo>> {
  return request<ApiResponse<Todo>>(`/api/todos/${id}/toggle`, {
    method: "PATCH",
  });
}

export async function attachTag(
  todoId: string,
  tagId: string
): Promise<ApiResponse<Todo>> {
  return request<ApiResponse<Todo>>(
    `/api/todos/${todoId}/tags/${tagId}`,
    { method: "POST" }
  );
}

export async function detachTag(
  todoId: string,
  tagId: string
): Promise<ApiResponse<Todo>> {
  return request<ApiResponse<Todo>>(
    `/api/todos/${todoId}/tags/${tagId}`,
    { method: "DELETE" }
  );
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function fetchTags(): Promise<ApiResponse<Tag[]>> {
  return request<ApiResponse<Tag[]>>("/api/tags");
}

export async function createTag(
  input: CreateTagInput
): Promise<ApiResponse<Tag>> {
  return request<ApiResponse<Tag>>("/api/tags", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTag(
  id: string,
  input: UpdateTagInput
): Promise<ApiResponse<Tag>> {
  return request<ApiResponse<Tag>>(`/api/tags/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteTag(id: string): Promise<void> {
  await request<void>(`/api/tags/${id}`, { method: "DELETE" });
}
