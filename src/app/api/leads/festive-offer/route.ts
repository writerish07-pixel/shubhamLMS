import { NextResponse } from "next/server";
import { FESTIVE_MODEL_ROWS, HDFC_OFFER } from "@/lib/festive-offer";
import { festiveOfferPreview, sendFestiveOfferBlast } from "@/lib/festive-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const preview = await festiveOfferPreview();
  return NextResponse.json({
    ...preview,
    hdfcOffer: HDFC_OFFER,
    modelOffers: FESTIVE_MODEL_ROWS,
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  try {
    const result = await sendFestiveOfferBlast(
      Number.isFinite(body.limit) ? Number(body.limit) : 25,
    );
    return NextResponse.json(result);
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
