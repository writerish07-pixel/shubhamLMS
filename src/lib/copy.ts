import type { Lead, SequenceStep, Settings } from "@/lib/types";

export const HERO_MODELS = [
  "Splendor Plus",
  "Splendor Xtec",
  "HF Deluxe",
  "Passion Plus",
  "Glamour",
  "Super Splendor",
  "Xtreme 125R",
  "Xtreme 160R",
  "Xpulse 200 4V",
  "Karizma XMR",
  "Destini 125",
  "Xoom 160",
  "Pleasure+",
  "Other / Not sure",
] as const;

export function interpolate(
  template: string,
  lead: Pick<Lead, "name" | "phone" | "model">,
  settings: Settings,
  extra: Record<string, string> = {},
): string {
  const firstName = lead.name.split(/\s+/)[0] || lead.name;
  const values: Record<string, string> = {
    name: lead.name,
    firstName,
    model: lead.model,
    phone: lead.phone,
    business: settings.businessName,
    city: settings.city,
    address: settings.showroomAddress,
    dealerPhone: settings.channelPhone,
    ...extra,
  };

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    return values[key] ?? "";
  });
}

export function buttonHint(step: SequenceStep): string {
  if (step.button === "booked") {
    return "\n\nReply BOOKED or tap the Booked button to confirm your booking.";
  }
  return "\n\nReply PURCHASE or tap the Purchase button after payment is complete.";
}
