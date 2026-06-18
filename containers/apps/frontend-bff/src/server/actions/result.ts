export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };
