import { NextResponse } from "next/server";
import { getFunnels } from "@/lib/controllers/funnels";

export async function GET() {
  return NextResponse.json({ funnels: await getFunnels() });
}