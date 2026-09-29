import { NextResponse } from "next/server";
import { isAbortError } from "@/lib/abort";
import { getEntryLookup } from "@/lib/controllers/entries";
import { SHOW_ENTRY_LOOKUP } from "@/lib/feature-flags";
import {
  emailLookupPagesForDepth,
  parseScanDepthOrNull,
} from "@/lib/scan-depth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const query = id?.trim();
  if (!SHOW_ENTRY_LOOKUP) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!query) {
    return NextResponse.json({ error: "Missing lookup query" }, { status: 400 });
  }

  const url = new URL(request.url);
  const entryOnly = url.searchParams.get("entryOnly") === "1";
  const includeUserData = url.searchParams.get("userData") !== "0";
  const includeEvents = url.searchParams.get("events") !== "0";
  const fromDay = url.searchParams.get("from")?.trim() || undefined;
  const toDay = url.searchParams.get("to")?.trim() || undefined;
  const scanDepthRaw = url.searchParams.get("scanDepth")?.trim();
  if (scanDepthRaw && !parseScanDepthOrNull(scanDepthRaw)) {
    return NextResponse.json({ error: "Invalid scanDepth" }, { status: 400 });
  }
  if (scanDepthRaw) {
    emailLookupPagesForDepth(parseScanDepthOrNull(scanDepthRaw)!);
  }

  if ((fromDay && !toDay) || (!fromDay && toDay)) {
    return NextResponse.json(
      { error: "Date range requires both from and to dates" },
      { status: 400 },
    );
  }

  try {
    const resolved = await getEntryLookup(decodeURIComponent(query), {
      entryOnly,
      includeUserData,
      includeEvents,
      fromDay,
      toDay,
    });
    return NextResponse.json(resolved);
  } catch (error) {
    if (isAbortError(error)) {
      return NextResponse.json({ error: "Lookup timed out" }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : "Lookup failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}