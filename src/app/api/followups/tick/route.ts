import { NextResponse } from "next/server";
import { processDueFollowups } from "@/lib/followup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await processDueFollowups(25);
  return NextResponse.json(result);
}

export async function GET() {
  const result = await processDueFollowups(25);
  return NextResponse.json(result);
}
