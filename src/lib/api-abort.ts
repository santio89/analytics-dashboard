import { isAbortError } from "@/lib/abort";

export function abortResponse(): Response {
  return new Response(null, { status: 499, statusText: "Client Closed Request" });
}

export function isClientAbort(error: unknown): boolean {
  return isAbortError(error);
}
