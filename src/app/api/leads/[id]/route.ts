import { NextResponse } from "next/server";
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
