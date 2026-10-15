import { HINDI_TEMPLATES, templateBodyVariables } from "@/lib/hindi-templates";
import type { CachedBotspaceTemplate, Settings } from "@/lib/types";
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
    variables?: string[];
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

  const variables =
    input.variables ?? templateBodyVariables(input.templateId, input.name, input.model);
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
      "WhatsApp template send failed and the 24-hour session window is closed. Create the Hindi templates in BotSpace: shubham_lead_followup, shubham_booking_hi, shubham_bought_hi, herofestiveoffer, and shubham_festive_offer.",
  );
}

export type HarvestedTemplate = CachedBotspaceTemplate;

const TEMPLATE_CACHE_MS = 6 * 60 * 60 * 1000;

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
        checkedAt: new Date().toISOString(),
      });
    }
    for (const nested of Object.values(obj)) visit(nested, depth + 1);
  };
  visit(raw);
  return found;
}

function deliveryFromMessage(raw: unknown): { deliveryStatus?: string; failedReason?: string } {
  const payload = asRecord(raw) ?? {};
  const inner = asRecord(payload.data) ?? payload;
  if (inner.failed === true) {
    return {
      deliveryStatus: "FAILED",
      failedReason:
        typeof inner.failedReason === "string" ? inner.failedReason : undefined,
    };
  }
  if (inner.read === true) return { deliveryStatus: "READ" };
  if (inner.delivered === true) return { deliveryStatus: "DELIVERED" };
  if (inner.sent === true) return { deliveryStatus: "SENT" };
  return {};
}

function mergeHarvested(rows: HarvestedTemplate[]): HarvestedTemplate[] {
  const byId = new Map<string, HarvestedTemplate>();
  for (const row of rows) {
    const key = row.templateId;
    const previous = byId.get(key);
    if (!previous) {
      byId.set(key, row);
      continue;
    }
    const preferNew = Boolean(row.body) && !previous.body;
    const newer =
      Date.parse(row.checkedAt || "") > Date.parse(previous.checkedAt || "");
    if (preferNew || (!previous.body && !row.body && newer) || (row.body && newer)) {
      byId.set(key, { ...previous, ...row, body: row.body || previous.body });
    } else {
      byId.set(key, { ...row, ...previous, body: previous.body || row.body });
    }
  }
  return [...byId.values()].sort((a, b) => a.templateId.localeCompare(b.templateId));
}

function cacheFresh(row: HarvestedTemplate | undefined, refresh: boolean) {
  if (refresh || !row?.checkedAt) return false;
  const age = Date.now() - Date.parse(row.checkedAt);
  return Number.isFinite(age) && age >= 0 && age < TEMPLATE_CACHE_MS;
}

async function readTemplateMessage(
  settings: Settings,
  messageId: string,
): Promise<HarvestedTemplate[]> {
  const result = await botspace<unknown>(
    settings,
    `/v1/${settings.channelId}/message/${messageId}`,
  );
  if (!result.ok) return [];
  const delivery = deliveryFromMessage(result.raw);
  return extractTemplates(result.raw, messageId).map((row) => ({
    ...row,
    ...delivery,
    checkedAt: new Date().toISOString(),
  }));
}

async function probeTemplateOnChannel(
  settings: Settings,
  templateId: string,
): Promise<HarvestedTemplate> {
  const now = new Date().toISOString();
  const sent = await sendTemplateMessage(settings, {
    name: settings.businessName || "Shubham Motors",
    phone: settings.channelPhone,
    templateId,
    variables: templateBodyVariables(templateId, "Test", "Splendor Plus"),
  });
  if (!sent.messageId) {
    return {
      templateId,
      failedReason: sent.error,
      checkedAt: now,
    };
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
  const harvested = await readTemplateMessage(settings, sent.messageId);
  const match = harvested.find((row) => row.templateId === templateId) ?? harvested[0];
  if (match?.body) return { ...match, templateId, checkedAt: now };
  return {
    templateId,
    sourceMessageId: sent.messageId,
    failedReason: sent.error,
    checkedAt: now,
  };
}

export async function inspectBotspaceTemplates(
  settings: Settings,
  messageIds: string[] = [],
  options: {
    cached?: HarvestedTemplate[];
    catalogIds?: string[];
    refresh?: boolean;
  } = {},
) {
  const uniqueIds = [...new Set(messageIds.filter(Boolean))].slice(0, 12);
  const fromMessages: HarvestedTemplate[] = [];

  for (const messageId of uniqueIds) {
    fromMessages.push(...(await readTemplateMessage(settings, messageId)));
  }

  let harvested = mergeHarvested([...(options.cached ?? []), ...fromMessages]);
  const catalogIds = [
    ...new Set(
      (options.catalogIds?.length
        ? options.catalogIds
        : [
            settings.inquiryTemplateId,
            settings.bookingTemplateId,
            settings.purchaseTemplateId,
            settings.festiveTemplateId,
            ...HINDI_TEMPLATES.map((row) => row.templateId),
          ]
      ).filter(Boolean),
    ),
  ];

  const missing = catalogIds.filter((id) => {
    const cached = harvested.find((row) => row.templateId === id);
    if (cached?.body && cacheFresh(cached, options.refresh === true)) return false;
    if (options.refresh) return true;
    return !cached?.body;
  });

  if (settings.apiKey && settings.channelPhone && missing.length > 0) {
    const probed = await Promise.all(
      missing.map((templateId) => probeTemplateOnChannel(settings, templateId)),
    );
    harvested = mergeHarvested([...harvested, ...probed]);
  }

  const found = harvested.filter((row) => Boolean(row.body));
  return {
    listed: found.length > 0,
    hasListEndpoint: false as const,
    docsUrl: "https://public-api.bot.space",
    publicPaths: BOTSPACE_PUBLIC_PATHS,
    error:
      found.length > 0
        ? undefined
        : "BotSpace Public API v1 has no template-list endpoint. Press sync to pull approved Template IDs from BotSpace (a test send to the showroom number). After festive approval, the festive ID should appear here.",
    harvested,
    harvestedFromMessages: uniqueIds.length,
  };
}
