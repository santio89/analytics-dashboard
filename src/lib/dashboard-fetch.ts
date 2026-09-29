export async function fetchDashboardJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, { signal });
  if (response.status === 499 || signal?.aborted) {
    throw signal?.reason ?? new DOMException("Aborted", "AbortError");
  }
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Dashboard request failed");
  }
  return payload;
}
