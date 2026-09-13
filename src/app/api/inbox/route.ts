import { NextResponse } from "next/server";
import { listInbox } from "@/lib/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await listInbox();
  return NextResponse.json(data);
}
