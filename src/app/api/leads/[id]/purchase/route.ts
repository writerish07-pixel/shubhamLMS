import { NextResponse } from "next/server";
import { markPurchased } from "@/lib/followup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const lead = await markPurchased(id, "staff");
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not mark purchased" },
      { status: 400 },
    );
  }
}
