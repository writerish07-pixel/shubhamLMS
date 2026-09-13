import Papa from "papaparse";
import { normalizeIndianPhone } from "@/lib/phones";

export type ParsedLeadRow = {
  row: number;
  name: string;
  mobile: string;
  phone: string | null;
  model: string;
  error?: string;
};

const NAME_HEADERS = ["name", "customer name", "customer", "naam", "full name", "lead name"];
const MOBILE_HEADERS = [
  "mobile",
  "mobile number",
  "phone",
  "phone number",
  "whatsapp",
  "whatsapp number",
  "number",
  "contact",
];
const MODEL_HEADERS = [
  "model",
  "model inquiry",
  "model enquiry",
  "model inquired for",
  "model enquired for",
  "bike",
  "vehicle",
  "hero model",
];

function normHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function pick(row: Record<string, string>, aliases: string[]): string {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const match = entries.find(([key]) => normHeader(key) === alias);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  for (const alias of aliases) {
    const match = entries.find(([key]) => normHeader(key).includes(alias));
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
}

export const CSV_TEMPLATE = `name,mobile,model
Rajesh Sharma,9876543210,Splendor Plus
Priya Verma,9123456789,Xtreme 160R
Amit Singh,9988776655,HF Deluxe
`;

export function parseLeadCsv(csvText: string): {
  rows: ParsedLeadRow[];
  errors: string[];
} {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  const errors: string[] = [...(parsed.errors ?? []).map((err) => err.message)];
  const rows: ParsedLeadRow[] = [];

  (parsed.data ?? []).forEach((raw, index) => {
    const name = pick(raw, NAME_HEADERS);
    const mobile = pick(raw, MOBILE_HEADERS);
    const model = pick(raw, MODEL_HEADERS);
    const phone = normalizeIndianPhone(mobile);
    const row: ParsedLeadRow = {
      row: index + 2,
      name,
      mobile,
      phone,
      model,
    };

    if (!name) row.error = "Name is required";
    else if (!mobile) row.error = "Mobile number is required";
    else if (!phone) row.error = "Mobile number is not a valid Indian WhatsApp number";
    else if (!model) row.error = "Model inquiry is required";

    rows.push(row);
  });

  if (!rows.length) errors.push("No lead rows found in the file.");
  return { rows, errors };
}
