import { NextResponse } from "next/server";
import { abortResponse, isClientAbort } from "@/lib/api-abort";
import { getUtmDashboard, getUtmOptions } from "@/lib/controllers/dashboard";
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
    if (scope === "options") {
      const options = await getUtmOptions(parsed, request.signal);
      return NextResponse.json(options);
    }

    const payload = await getUtmDashboard(parsed, request.signal);
    return NextResponse.json(payload);
  } catch (error) {
    if (isClientAbort(error)) return abortResponse();
    const message = error instanceof Error ? error.message : "UTM fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}