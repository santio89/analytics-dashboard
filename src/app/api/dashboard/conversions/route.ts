import { NextResponse } from "next/server";
import { abortResponse, isClientAbort } from "@/lib/api-abort";
import { getConversions } from "@/lib/controllers/dashboard";
import { resolveDashboardParams } from "@/lib/dashboard-params-server";

function searchParamsFromUrl(url: URL) {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export async function GET(request: Request) {
  const parsed = await resolveDashboardParams(searchParamsFromUrl(new URL(request.url)));

  try {
    const payload = await getConversions(parsed, request.signal);
    return NextResponse.json(payload);
  } catch (error) {
    if (isClientAbort(error)) return abortResponse();
    const message =
      error instanceof Error ? error.message : "Conversion fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}