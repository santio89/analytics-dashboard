import { NextResponse } from "next/server";
import { abortResponse, isClientAbort } from "@/lib/api-abort";
import { getCharts, getPageFunnel } from "@/lib/controllers/dashboard";
import { resolveDashboardParams } from "@/lib/dashboard-params-server";

function searchParamsFromUrl(url: URL) {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = await resolveDashboardParams(searchParamsFromUrl(url));
  const scope = url.searchParams.get("scope");

  try {
    if (scope === "page-funnel") {
      const payload = await getPageFunnel(parsed, request.signal);
      return NextResponse.json(payload);
    }

    const payload = await getCharts(parsed, request.signal);
    return NextResponse.json(payload);
  } catch (error) {
    if (isClientAbort(error)) return abortResponse();
    const message = error instanceof Error ? error.message : "Chart fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}