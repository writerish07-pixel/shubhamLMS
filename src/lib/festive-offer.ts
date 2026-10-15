import { HERO_MODELS } from "@/lib/copy";
import type { Lead } from "@/lib/types";

/** Hero Festive 2026 cash bonus window (IST). */
export const FESTIVE_START_ISO = "2026-10-08T00:00:00+05:30";
export const FESTIVE_END_ISO = "2026-10-20T23:59:59.999+05:30";

export const HDFC_OFFER = "HDFC 5% कैशबैक (अधिकतम ₹5,000)";

const CASH_BONUS_BY_NEEDLE: { needle: string; amount: number }[] = [
  { needle: "destini 110", amount: 2100 },
  { needle: "destini", amount: 2500 },
  { needle: "pleasure", amount: 2500 },
  { needle: "hf deluxe", amount: 2500 },
  { needle: "xtreme 125", amount: 3000 },
  { needle: "xtreme 160", amount: 10000 },
  { needle: "xtreme 200s", amount: 10000 },
  { needle: "200s", amount: 10000 },
  { needle: "karizma", amount: 25000 },
  { needle: "xpulse 200t", amount: 25000 },
  { needle: "mavrick", amount: 50000 },
  { needle: "maverick", amount: 50000 },
];

function normalizeModel(model: string): string {
  return model.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Hero cash bonus from the Festive 2026 circular, or null when the model is not listed. */
export function festiveCashBonus(model: string): number | null {
  const key = normalizeModel(model);
  if (!key) return null;
  // Xoom 125/160 are explicitly excluded from the scooter cash bonus.
  if (key.includes("xoom")) return null;
  for (const row of CASH_BONUS_BY_NEEDLE) {
    if (key.includes(row.needle)) return row.amount;
  }
  return null;
}

/**
 * WhatsApp {{3}} value.
 * PDF models get Hero cash bonus + HDFC. Models not in the circular still get HDFC 5% / max ₹5,000.
 */
export function festiveOfferLine(model: string): string {
  const cash = festiveCashBonus(model);
  if (cash != null) {
    return `${formatInr(cash)} कैश बोनस + ${HDFC_OFFER}`;
  }
  return HDFC_OFFER;
}

export function festiveOfferActive(now = new Date()): boolean {
  const start = new Date(FESTIVE_START_ISO).getTime();
  const end = new Date(FESTIVE_END_ISO).getTime();
  const ts = now.getTime();
  return ts >= start && ts <= end;
}

export function festiveEligible(lead: Pick<Lead, "status" | "festiveOfferSentAt">): boolean {
  if (lead.status === "purchased") return false;
  if (lead.festiveOfferSentAt) return false;
  return true;
}

export const FESTIVE_MODEL_ROWS: { model: string; cashBonus: number | null; offer: string }[] =
  HERO_MODELS.map((model) => ({
    model,
    cashBonus: festiveCashBonus(model),
    offer: festiveOfferLine(model),
  }));
