import { NextResponse } from "next/server";
import { setLeadPaused } from "@/lib/followup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { paused?: boolean };
  try {
    const lead = await setLeadPaused(id, body.paused !== false);
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update follow-up" },
      { status: 400 },
    );
  }
}
