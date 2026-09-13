function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function collectStrings(value: unknown, into: string[], depth = 0) {
  if (depth > 6 || value == null) return;
  if (typeof value === "string" && value.trim()) {
    into.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, into, depth + 1));
    return;
  }
  const obj = asRecord(value);
  if (!obj) return;
  for (const [key, nested] of Object.entries(obj)) {
    if (
      [
        "message",
        "error",
        "failedReason",
        "failed_reason",
        "details",
        "detail",
        "error_user_msg",
        "error_user_title",
        "description",
        "error_data",
      ].includes(key)
    ) {
      collectStrings(nested, into, depth + 1);
    }
  }
}

export function extractProviderError(raw: unknown, fallback: string): string {
  const parts: string[] = [];
  collectStrings(raw, parts);
  const unique = [...new Set(parts.filter((part) => part && part !== fallback))];
  const picked =
    unique.find((part) => /\d{5,6}|template|parameter|window|deliver/i.test(part)) ??
    unique[0];
  return picked || fallback;
}

export function sendStatusFailed(status: unknown): boolean {
  if (typeof status !== "string") return false;
  const value = status.trim().toLowerCase();
  return value === "failed" || value === "error" || value === "rejected";
}

export function explainWhatsAppError(error: string): string {
  const text = error.toLowerCase();
  if (/132000|number of param|parameter/.test(text)) {
    return `${error} — Template variables must be name then model (2 values). Marketing/utility body uses {{1}} and {{2}} only.`;
  }
  if (/132001|template does not exist|template not found|not approved/.test(text)) {
    return `${error} — Create the 3 Hindi UTILITY templates in BotSpace: shubham_lead_followup_hi (बुकिंग), shubham_booking_hi (खरीद), shubham_bought_hi. Language hi.`;
  }
  if (/131047|24 hour|re-engagement|session window/.test(text)) {
    return `${error} — Free-form WhatsApp only works for 24 hours after the customer messages. New leads need an approved template.`;
  }
  if (/131049|healthy ecosystem|marketing/.test(text)) {
    return `${error} — Meta dropped a MARKETING template. Use the 3 Hindi UTILITY templates (follow-up, booking, bought).`;
  }
  if (/131026|not on whatsapp|not a valid whatsapp/.test(text)) {
    return `${error} — This mobile number is not on WhatsApp.`;
  }
  if (/131051/.test(text)) {
    return `${error} — Unsupported message type for this recipient.`;
  }
  return error;
}

export function isOpenSessionWindow(lastInboundAt: string | null | undefined): boolean {
  if (!lastInboundAt) return false;
  const then = new Date(lastInboundAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then < 24 * 60 * 60 * 1000;
}
