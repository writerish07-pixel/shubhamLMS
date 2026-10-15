import { NextResponse } from "next/server";
import { sendFestiveOfferToLead } from "@/lib/festive-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { force?: boolean };
  try {
    const { lead, result } = await sendFestiveOfferToLead(id, body.force === true);
    return NextResponse.json({ lead, result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not send festive offer",
      },
      { status: 400 },
    );
  }
}
