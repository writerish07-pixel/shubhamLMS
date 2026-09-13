import { normalizeIndianPhone } from "@/lib/phones";

export type ParsedInbound = {
  phone: string;
  name: string | null;
  text: string;
  conversationId: string | null;
  direction: "in" | "out" | "unknown";
};

export type ParsedDelivery = {
  messageId: string | null;
  status: "sent" | "delivered" | "read" | "failed";
  failedReason: string | null;
  phone: string | null;
};

const ID_LIKE = /^[a-f0-9]{24}$/i;
const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function walk(value: unknown, visit: (key: string, nested: unknown) => void, depth = 0) {
  if (depth > 8 || value == null) return;
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visit, depth + 1));
    return;
  }
  const obj = asRecord(value);
  if (!obj) return;
  for (const [key, nested] of Object.entries(obj)) {
    visit(key, nested);
    walk(nested, visit, depth + 1);
  }
}

function isNoise(text: string) {
  const value = text.trim();
  if (!value) return true;
  if (ID_LIKE.test(value) || UUID_LIKE.test(value)) return true;
  if (/^https?:\/\//i.test(value)) return true;
  if (value.length > 2000) return true;
  return false;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export function parseBotspaceInbound(payload: unknown): ParsedInbound | null {
  const found = {
    direction: "unknown" as ParsedInbound["direction"],
    name: null as string | null,
    conversationId: null as string | null,
  };
  const phones: string[] = [];
  const texts: string[] = [];

  walk(payload, (key, nested) => {
    const lower = key.toLowerCase();
    if (lower === "direction" && typeof nested === "string") {
      const value = nested.toLowerCase();
      if (value.includes("out")) found.direction = "out";
      else if (value.includes("in")) found.direction = "in";
    }
    if (
      (lower === "name" || lower === "sendername" || lower === "customername") &&
      typeof nested === "string" &&
      nested.trim() &&
      !found.name
    ) {
      found.name = nested.trim();
    }
    if (
      (lower === "conversationid" || lower === "conversation_id") &&
      typeof nested === "string"
    ) {
      found.conversationId = nested;
    }
    if (
      ["phone", "fullphonenumber", "waid", "mobile", "whatsapp"].includes(lower) &&
      typeof nested === "string"
    ) {
      const phone = normalizeIndianPhone(nested);
      if (phone) phones.push(phone);
    }
    if (["from", "destination"].includes(lower) && typeof nested === "string") {
      const phone = normalizeIndianPhone(nested);
      if (phone) phones.push(phone);
    }
    if (
      [
        "text",
        "body",
        "title",
        "reply",
        "postbacktext",
        "buttontext",
        "caption",
      ].includes(lower)
    ) {
      const text = firstString(nested);
      if (text && !isNoise(text)) texts.push(text);
    }
  });

  if (found.direction === "out") return null;

  const dealer = "7240516000";
  const customerPhone =
    phones.find((item) => !item.replace(/\D/g, "").endsWith(dealer)) ??
    phones[0];
  if (!customerPhone) return null;

  const text =
    texts.find((item) => !normalizeIndianPhone(item)) ??
    texts[0] ??
    "Incoming WhatsApp";

  return {
    phone: customerPhone,
    name: found.name,
    text: text.slice(0, 4000),
    conversationId: found.conversationId,
    direction: found.direction,
  };
}

function normalizeDeliveryStatus(value: string): ParsedDelivery["status"] | null {
  const status = value.trim().toUpperCase();
  if (status === "FAILED" || status === "ERROR") return "failed";
  if (status === "READ" || status === "CLICKED") return "read";
  if (status === "DELIVERED") return "delivered";
  if (status === "SENT" || status === "ACCEPTED" || status === "SUBMITTED") return "sent";
  return null;
}

export function parseBotspaceDelivery(payload: unknown): ParsedDelivery | null {
  const root = asRecord(payload);
  if (!root) return null;

  let event: string | null = null;
  let statusRaw: string | null = null;
  let messageId: string | null = null;
  let failedReason: string | null = null;
  const phones: string[] = [];

  walk(payload, (key, nested) => {
    const lower = key.toLowerCase();
    if (lower === "event" && typeof nested === "string") event = nested;
    if (lower === "status" && typeof nested === "string" && !statusRaw) {
      statusRaw = nested;
    }
    if (
      (lower === "failedreason" || lower === "failed_reason") &&
      typeof nested === "string"
    ) {
      failedReason = nested;
    }
    if (
      ["id", "messageid", "message_id"].includes(lower) &&
      typeof nested === "string" &&
      nested.trim() &&
      !messageId
    ) {
      messageId = nested.trim();
    }
    if (
      ["phone", "fullphonenumber", "waid", "mobile", "whatsapp"].includes(lower) &&
      typeof nested === "string"
    ) {
      const phone = normalizeIndianPhone(nested);
      if (phone) phones.push(phone);
    }
    if (lower === "phone" && nested && typeof nested === "object") {
      const obj = asRecord(nested);
      const combined = `${obj?.countryCode ?? ""}${obj?.phone ?? ""}`;
      const phone = normalizeIndianPhone(combined);
      if (phone) phones.push(phone);
    }
  });

  const eventLooksDelivery =
    typeof event === "string" && /delivery/i.test(event);
  const status = statusRaw ? normalizeDeliveryStatus(statusRaw) : null;
  if (!eventLooksDelivery && !status) return null;
  if (!status) return null;
  if (!eventLooksDelivery && status === "sent" && !failedReason) {
    return null;
  }

  const dealer = "7240516000";
  const customerPhone =
    phones.find((item) => !item.replace(/\D/g, "").endsWith(dealer)) ??
    phones[0] ??
    null;

  return {
    messageId,
    status,
    failedReason,
    phone: customerPhone,
  };
}
