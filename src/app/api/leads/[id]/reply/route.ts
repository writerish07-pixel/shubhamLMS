import { NextResponse } from "next/server";
import { sendStaffReply } from "@/lib/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { text?: string };
  try {
    const data = await sendStaffReply(id, body.text || "");
    return NextResponse.json(data, { status: data.result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reply failed" },
      { status: 400 },
    );
  }
}
