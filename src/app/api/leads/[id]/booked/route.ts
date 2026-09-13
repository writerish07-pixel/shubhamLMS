import { NextResponse } from "next/server";
import { markBooked } from "@/lib/followup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const lead = await markBooked(id, "staff");
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not mark booked" },
      { status: 400 },
    );
  }
}
