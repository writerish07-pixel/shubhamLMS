import { NextResponse } from "next/server";
import { rescheduleWaitingLeads } from "@/lib/followup";
import { parseClock } from "@/lib/schedule";
import { withStore } from "@/lib/store";
import type { SequenceStep } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanSteps(steps: SequenceStep[] | undefined) {
  if (!steps) return undefined;
  return steps.map((step) => ({
    ...step,
    delayMinutes: Math.max(0, Math.round(Number(step.delayMinutes) || 0)),
    sendAtTime: parseClock(step.sendAtTime) ? step.sendAtTime : null,
    enabled: step.enabled !== false,
  }));
}

export async function GET() {
  const data = await withStore((store) => ({
    inquirySequence: store.inquirySequence,
    bookingSequence: store.bookingSequence,
    followupWindowStart: store.settings.followupWindowStart,
    followupWindowEnd: store.settings.followupWindowEnd,
  }));
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    inquirySequence?: SequenceStep[];
    bookingSequence?: SequenceStep[];
    followupWindowStart?: string;
    followupWindowEnd?: string;
    applyToWaitingLeads?: boolean;
  };
  const data = await withStore((store) => {
    const inquiry = cleanSteps(body.inquirySequence);
    const booking = cleanSteps(body.bookingSequence);
    if (inquiry) store.inquirySequence = inquiry;
    if (booking) store.bookingSequence = booking;
    if (parseClock(body.followupWindowStart)) {
      store.settings.followupWindowStart = body.followupWindowStart as string;
    }
    if (parseClock(body.followupWindowEnd)) {
      store.settings.followupWindowEnd = body.followupWindowEnd as string;
    }
    if (body.applyToWaitingLeads) {
      rescheduleWaitingLeads(store);
    }
    return {
      inquirySequence: store.inquirySequence,
      bookingSequence: store.bookingSequence,
      followupWindowStart: store.settings.followupWindowStart,
      followupWindowEnd: store.settings.followupWindowEnd,
    };
  });
  return NextResponse.json(data);
}
