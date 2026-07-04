export function readApiError(err: unknown, fallback: string): string {
  const e = err as { error?: { message?: string; errors?: string[] }; message?: string };
  return e?.error?.errors?.[0] || e?.error?.message || e?.message || fallback;
}
