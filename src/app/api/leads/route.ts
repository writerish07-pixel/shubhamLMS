import { NextResponse } from "next/server";
import { createLeads } from "@/lib/leads";
import { processDueFollowups } from "@/lib/followup";
import { normalizeIndianPhone } from "@/lib/phones";
import { readStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ leads: store.leads });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    mobile?: string;
    phone?: string;
    model?: string;
    notes?: string;
    startFollowup?: boolean;
  };

  const name = body.name?.trim();
  const model = body.model?.trim();
  const phone = normalizeIndianPhone(body.phone || body.mobile || "");

  if (!name || !phone || !model) {
    return NextResponse.json(
      { error: "Name, valid mobile number, and model inquiry are required." },
      { status: 400 },
    );
  }

  const result = await createLeads([
    {
      name,
      phone,
      model,
      source: "manual",
      notes: body.notes,
      startFollowup: body.startFollowup !== false,
    },
  ]);

  if (!result.created.length) {
    return NextResponse.json(
      { error: result.skipped[0]?.reason ?? "Lead was not created." },
      { status: 409 },
    );
  }

  if (body.startFollowup !== false) {
    void processDueFollowups(5);
  }

  return NextResponse.json({ lead: result.created[0], skipped: result.skipped });
}
