import { NextResponse } from "next/server";
import { setLeadSchedule } from "@/lib/followup";
import { fromIstDatetimeLocal } from "@/lib/schedule";
import { readStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const store = await readStore();
  const lead = store.leads.find((item) => item.id === id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const messages = store.messages.filter((item) => item.leadId === id);
  return NextResponse.json({ lead, messages });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { nextFollowupAt?: string | null };
  const raw = body.nextFollowupAt;
  if (raw === undefined) {
    return NextResponse.json({ error: "nextFollowupAt is required" }, { status: 400 });
  }
  try {
    let iso: string | null = raw;
    if (raw === null || raw === "") {
      iso = new Date().toISOString();
    } else if (!raw.endsWith("Z") && !raw.includes("+") && raw.includes("T")) {
      iso = fromIstDatetimeLocal(raw) ?? raw;
    }
    const lead = await setLeadSchedule(id, iso);
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not schedule" },
      { status: 400 },
    );
  }
}
