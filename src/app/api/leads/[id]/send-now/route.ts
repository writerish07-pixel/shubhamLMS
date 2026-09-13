import { NextResponse } from "next/server";
import { sendNow } from "@/lib/followup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const { lead, result } = await sendNow(id);
    return NextResponse.json({ lead, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send WhatsApp" },
      { status: 400 },
    );
  }
}
