export const LOOKUP_TIMEOUT_MESSAGE =
  "Lookup timed out. Try a smaller scan depth or a narrower date range.";

export function nonJsonResponseMessage(text: string, status: number): string {
  if (status === 504 || status === 502 || status === 503) {
    return LOOKUP_TIMEOUT_MESSAGE;
  }
  if (/an error occurred/i.test(text) || /function_invocation_timeout/i.test(text)) {
    return LOOKUP_TIMEOUT_MESSAGE;
  }
  const trimmed = text.trim();
  if (!trimmed) return "Lookup failed";
  return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
}

export async function readJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) {
      throw new Error("Lookup failed");
    }
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(nonJsonResponseMessage(text, res.status));
  }
}
