import { NextResponse } from "next/server";
import { sendLeadWhatsApp } from "@/lib/botspace";
import { normalizeIndianPhone } from "@/lib/phones";
import { withStore } from "@/lib/store";
import type { Settings } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await withStore((store) => store.settings);
  return NextResponse.json({
    settings: {
      ...settings,
      apiKey: settings.apiKey ? `${settings.apiKey.slice(0, 12)}…${settings.apiKey.slice(-6)}` : "",
      apiKeySet: Boolean(settings.apiKey),
    },
    raw: settings,
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<Settings> & { apiKey?: string };
  const settings = await withStore((store) => {
    store.settings = {
      ...store.settings,
      ...body,
      apiKey: body.apiKey && !body.apiKey.includes("…") ? body.apiKey : store.settings.apiKey,
    };
    return store.settings;
  });
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; name?: string; model?: string };
  const settings = await withStore((store) => store.settings);
  const phone = normalizeIndianPhone(body.phone || "");
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid Indian mobile number." }, { status: 400 });
  }
  const result = await sendLeadWhatsApp(settings, {
    name: body.name || "Test lead",
    phone,
    model: body.model || "Splendor Plus",
    text: `Test WhatsApp from ${settings.businessName}, ${settings.city}. If you received this, BotSpace is connected.`,
    templateId: settings.inquiryTemplateId,
    preferTemplate: Boolean(settings.inquiryTemplateId),
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
