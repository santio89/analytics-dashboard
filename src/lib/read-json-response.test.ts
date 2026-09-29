import { describe, expect, it } from "vitest";
import {
  LOOKUP_TIMEOUT_MESSAGE,
  nonJsonResponseMessage,
  readJsonResponse,
} from "@/lib/read-json-response";

describe("readJsonResponse", () => {
  it("parses JSON bodies", async () => {
    const res = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    await expect(readJsonResponse<{ ok: boolean }>(res)).resolves.toEqual({ ok: true });
  });

  it("maps plain-text platform errors to a lookup timeout hint", async () => {
    const res = new Response("An error occurred with this deployment.", {
      status: 500,
    });
    await expect(readJsonResponse(res)).rejects.toThrow(LOOKUP_TIMEOUT_MESSAGE);
    expect(nonJsonResponseMessage("An error occurred with this deployment.", 500)).toBe(
      LOOKUP_TIMEOUT_MESSAGE,
    );
  });
});
