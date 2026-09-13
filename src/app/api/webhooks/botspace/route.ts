import { NextResponse } from "next/server";
import { detectWhatsAppAction, markBooked, markPurchased } from "@/lib/followup";
import { parseBotspaceInbound } from "@/lib/inbound";
import { recordInbound } from "@/lib/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Shubham Motors BotSpace webhook",
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = parseBotspaceInbound(payload);
  if (!parsed) {
    return NextResponse.json({ ignored: true, reason: "not-inbound" });
  }

  const recorded = await recordInbound(parsed);
  const action = detectWhatsAppAction(parsed.text);

  if (action === "booked") {
    await markBooked(recorded.lead.id, "whatsapp");
  } else if (action === "purchase") {
    await markPurchased(recorded.lead.id, "whatsapp");
  }

  return NextResponse.json({
    ok: true,
    leadId: recorded.lead.id,
    created: recorded.created,
    action,
  });
}
