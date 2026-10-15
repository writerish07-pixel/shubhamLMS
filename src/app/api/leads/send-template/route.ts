import { NextResponse } from "next/server";
import { sendChosenTemplateBlast } from "@/lib/send-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    leadIds?: string[];
    templateId?: string;
  };
  const leadIds = Array.isArray(body.leadIds) ? body.leadIds.filter(Boolean) : [];
  const templateId = body.templateId?.trim() || "";
  if (!leadIds.length) {
    return NextResponse.json({ error: "Select at least one lead." }, { status: 400 });
  }
  if (!templateId) {
    return NextResponse.json({ error: "Choose a WhatsApp template." }, { status: 400 });
  }
  try {
    const result = await sendChosenTemplateBlast(leadIds, templateId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send template" },
      { status: 400 },
    );
  }
}
