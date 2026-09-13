import { NextResponse } from "next/server";
import { withStore } from "@/lib/store";
import type { SequenceStep } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await withStore((store) => ({
    inquirySequence: store.inquirySequence,
    bookingSequence: store.bookingSequence,
  }));
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    inquirySequence?: SequenceStep[];
    bookingSequence?: SequenceStep[];
  };
  const data = await withStore((store) => {
    if (body.inquirySequence) store.inquirySequence = body.inquirySequence;
    if (body.bookingSequence) store.bookingSequence = body.bookingSequence;
    return {
      inquirySequence: store.inquirySequence,
      bookingSequence: store.bookingSequence,
    };
  });
  return NextResponse.json(data);
}
