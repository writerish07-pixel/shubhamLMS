import { templateBodyVariables } from "@/lib/hindi-templates";
import type { Settings } from "@/lib/types";
import {
  explainWhatsAppError,
  extractProviderError,
  sendStatusFailed,
} from "@/lib/whatsapp-errors";

const BASE = "https://public-api.bot.space";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

type SendResult = {
  ok: boolean;
  simulated?: boolean;
  messageId?: string;
  conversationId?: string;
  contactId?: string;
  error?: string;
  raw?: unknown;
};

function failResult(error: string | undefined, raw?: unknown): SendResult {
  return {
    ok: false,
    error: explainWhatsAppError(error || "WhatsApp send failed"),
    raw,
  };
}

function unwrapSendPayload(raw: unknown): {
  id?: string;
  conversationId?: string;
  status?: string;
} {
  const payload = asRecord(raw) ?? {};
  const inner = asRecord(payload.data) ?? payload;
  return {
    id: typeof inner.id === "string" ? inner.id : undefined,
    conversationId:
      typeof inner.conversationId === "string" ? inner.conversationId : undefined,
    status: typeof inner.status === "string" ? inner.status : undefined,
  };
}

async function botspace<T>(
  settings: Settings,
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T | null; error?: string; raw: unknown }> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("apiKey", settings.apiKey);

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let raw: unknown = text;
  try {
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = { body: text };
  }

  if (!response.ok) {
    const error = extractProviderError(
      raw,
      (raw as { message?: string; error?: string })?.message ||
        (raw as { error?: string })?.error ||
        `BotSpace HTTP ${response.status}`,
    );
    return { ok: false, status: response.status, data: null, error, raw };
  }

  const envelope = asRecord(raw);
  if (envelope && envelope.success === false) {
    return {
      ok: false,
      status: response.status,
      data: null,
      error: extractProviderError(raw, "BotSpace request failed"),
      raw,
    };
  }

  return { ok: true, status: response.status, data: raw as T, error: undefined, raw };
}

export async function getMessageDeliveryStatus(
  settings: Settings,
  messageId: string,
): Promise<{ status?: string; failedReason?: string; raw: unknown; ok: boolean }> {
  const result = await botspace<{
    data?: { status?: string; failedReason?: string };
    status?: string;
    failedReason?: string;
  }>(settings, `/v1/${settings.channelId}/message/${messageId}/delivery-status`);
  const payload = asRecord(result.data) ?? {};
  const inner = asRecord(payload.data) ?? payload;
  return {
    ok: result.ok,
    status: typeof inner.status === "string" ? inner.status : undefined,
    failedReason:
      typeof inner.failedReason === "string"
        ? inner.failedReason
        : typeof inner.failed_reason === "string"
          ? inner.failed_reason
          : undefined,
    raw: result.raw,
  };
}

async function confirmDelivery(
  settings: Settings,
  result: SendResult,
): Promise<SendResult> {
  if (!result.ok || !result.messageId) return result;
  await new Promise((resolve) => setTimeout(resolve, 900));
  const delivery = await getMessageDeliveryStatus(settings, result.messageId);
  if (!delivery.ok || !delivery.status) return result;
  if (sendStatusFailed(delivery.status)) {
    return failResult(
      delivery.failedReason || `WhatsApp delivery ${delivery.status}`,
      delivery.raw,
    );
  }
  return result;
}

export async function sendTemplateMessage(
  settings: Settings,
  input: {
    name: string;
    phone: string;
    templateId: string;
    variables: string[];
  },
): Promise<SendResult> {
  const result = await botspace<{
    data?: { id?: string; conversationId?: string; status?: string };
    id?: string;
    conversationId?: string;
  }>(settings, `/v1/${settings.channelId}/message/send-message`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      templateId: input.templateId,
      variables: input.variables.map((value) => String(value ?? "")),
    }),
  });

  if (!result.ok) return failResult(result.error, result.raw);
  const inner = unwrapSendPayload(result.raw);
  if (sendStatusFailed(inner.status)) {
    return failResult(
      extractProviderError(result.raw, `Template send ${inner.status}`),
      result.raw,
    );
  }
  return {
    ok: true,
    messageId: inner.id,
    conversationId: inner.conversationId,
    raw: result.raw,
  };
}

export async function sendSessionMessage(
  settings: Settings,
  input: { name: string; phone: string; text: string },
): Promise<SendResult> {
  const result = await botspace<{
    data?: { id?: string; conversationId?: string };
  }>(settings, `/v1/${settings.channelId}/message/send-session-message`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      text: input.text,
    }),
  });

  if (!result.ok) return failResult(result.error, result.raw);
  const inner = unwrapSendPayload(result.raw);
  if (sendStatusFailed(inner.status)) {
    return failResult(
      extractProviderError(result.raw, `Session send ${inner.status}`),
      result.raw,
    );
  }
  return {
    ok: true,
    messageId: inner.id,
    conversationId: inner.conversationId,
    raw: result.raw,
  };
}

export async function createBotspaceContact(
  settings: Settings,
  input: { name: string; phone: string; model: string },
): Promise<SendResult> {
  const result = await botspace<{
    data?: { contactId?: string };
    contactId?: string;
  }>(settings, `/v1/contact`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      labels: ["Shubham Motors", "Hero lead", input.model],
      contactProperties: {
        modelInquiry: input.model,
        dealer: "Shubham Motors",
        city: "Jaipur",
      },
    }),
  });

  if (!result.ok) return { ok: false, error: result.error, raw: result.raw };
  const inner = (result.data as { data?: { contactId?: string } })?.data ?? result.data;
  return { ok: true, contactId: inner?.contactId, raw: result.raw };
}

export async function sendLeadWhatsApp(
  settings: Settings,
  input: {
    name: string;
    phone: string;
    model: string;
    text: string;
    templateId?: string;
    preferTemplate: boolean;
    sessionWindowOpen?: boolean;
  },
): Promise<SendResult> {
  if (!settings.liveWhatsApp) {
    return { ok: true, simulated: true };
  }

  if (settings.createBotspaceContacts) {
    await createBotspaceContact(settings, {
      name: input.name,
      phone: input.phone,
      model: input.model,
    }).catch(() => undefined);
  }

  const variables = templateBodyVariables(input.templateId, input.name, input.model);
  let lastError: string | undefined;

  if (input.preferTemplate && input.templateId) {
    const template = await sendTemplateMessage(settings, {
      name: input.name,
      phone: input.phone,
      templateId: input.templateId,
      variables,
    });
    if (template.ok) return confirmDelivery(settings, template);
    lastError = template.error;
  }

  const canUseSession = !input.preferTemplate || input.sessionWindowOpen === true;
  if (canUseSession) {
    const session = await sendSessionMessage(settings, {
      name: input.name,
      phone: input.phone,
      text: input.text,
    });
    if (session.ok) return confirmDelivery(settings, session);
    lastError = [lastError, session.error].filter(Boolean).join(" | ");
    return failResult(lastError, session.raw);
  }

  return failResult(
    lastError ||
      "WhatsApp template send failed and the 24-hour session window is closed. Create the 3 Hindi UTILITY templates in BotSpace: shubham_lead_followup, shubham_booking_hi, shubham_bought_hi.",
  );
}

export type HarvestedTemplate = {
  templateId: string;
  language?: string;
  body?: string;
  buttons?: string[];
  sourceMessageId?: string;
};

const BOTSPACE_PUBLIC_PATHS = [
  "POST /v1/{channelId}/message/send-message",
  "POST /v1/{channelId}/message/send-session-message",
  "POST /v1/{channelId}/message/send-session-media-message",
  "GET /v1/{channelId}/message/{messageId}",
  "GET /v1/{channelId}/message/{messageId}/delivery-status",
  "GET|POST /v1/{channelId}/conversation",
  "GET /v1/{channelId}/conversation/{conversationId}",
  "POST /v1/contact",
];

function extractTemplates(raw: unknown, sourceMessageId?: string): HarvestedTemplate[] {
  const found: HarvestedTemplate[] = [];
  const visit = (value: unknown, depth = 0) => {
    if (depth > 8 || value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    if (typeof value !== "object") return;
    const obj = value as Record<string, unknown>;
    if (typeof obj.templateId === "string") {
      const desc = obj.templateDesc as
        | { body?: string; buttons?: { label?: string }[] }
        | undefined;
      found.push({
        templateId: obj.templateId,
        language:
          typeof obj.templateLanguage === "string" ? obj.templateLanguage : undefined,
        body: typeof desc?.body === "string" ? desc.body : undefined,
        buttons: Array.isArray(desc?.buttons)
          ? desc.buttons
              .map((button) => button?.label)
              .filter((label): label is string => Boolean(label))
          : undefined,
        sourceMessageId,
      });
    }
    for (const nested of Object.values(obj)) visit(nested, depth + 1);
  };
  visit(raw);
  return found;
}

export async function inspectBotspaceTemplates(
  settings: Settings,
  messageIds: string[] = [],
) {
  const uniqueIds = [...new Set(messageIds.filter(Boolean))].slice(0, 12);
  const harvested: HarvestedTemplate[] = [];
  const seen = new Set<string>();

  for (const messageId of uniqueIds) {
    const result = await botspace<unknown>(
      settings,
      `/v1/${settings.channelId}/message/${messageId}`,
    );
    if (!result.ok) continue;
    for (const row of extractTemplates(result.raw, messageId)) {
      const key = `${row.templateId}:${row.language ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      harvested.push(row);
    }
  }

  return {
    listed: false as const,
    hasListEndpoint: false as const,
    docsUrl: "https://public-api.bot.space",
    publicPaths: BOTSPACE_PUBLIC_PATHS,
    error:
      "BotSpace Public API v1 can send templates but cannot list the template library. Hindi copy below is what this desk uses. Create the same Template IDs in BotSpace (language hi), then press sync.",
    harvested,
    harvestedFromMessages: uniqueIds.length,
  };
}
