import { NextResponse } from "next/server";
import { handleBotspaceWebhook } from "@/lib/followup";

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
  const result = await handleBotspaceWebhook(payload);
  return NextResponse.json(result);
}
