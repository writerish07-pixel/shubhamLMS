import { CSV_TEMPLATE } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="shubham-motors-leads-template.csv"',
    },
  });
}
