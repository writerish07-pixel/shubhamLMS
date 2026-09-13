import { NextResponse } from "next/server";
import { parseLeadCsv } from "@/lib/csv";
import { processDueFollowups } from "@/lib/followup";
import { createLeads } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const startFollowup = form.get("startFollowup") !== "false";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
  }

  const text = await file.text();
  const parsed = parseLeadCsv(text);
  const valid = parsed.rows.filter((row) => !row.error && row.phone);

  if (!valid.length) {
    return NextResponse.json(
      {
        error: "No valid leads in this file.",
        rows: parsed.rows,
        parseErrors: parsed.errors,
      },
      { status: 400 },
    );
  }

  const result = await createLeads(
    valid.map((row) => ({
      name: row.name,
      phone: row.phone as string,
      model: row.model,
      source: "csv" as const,
      startFollowup,
    })),
  );

  if (startFollowup && result.created.length) {
    void processDueFollowups(25);
  }

  return NextResponse.json({
    created: result.created.length,
    skipped: result.skipped,
    invalid: parsed.rows.filter((row) => row.error),
    leads: result.created,
  });
}
