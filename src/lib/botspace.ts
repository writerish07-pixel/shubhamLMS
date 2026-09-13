import type { Settings } from "@/lib/types";

const BASE = "https://public-api.bot.space";

type SendResult = {
  ok: boolean;
  simulated?: boolean;
  messageId?: string;
  conversationId?: string;
  contactId?: string;
  error?: string;
  raw?: unknown;
};

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
    const error =
      (raw as { message?: string; error?: string })?.message ||
      (raw as { error?: string })?.error ||
      `BotSpace HTTP ${response.status}`;
    return { ok: false, status: response.status, data: null, error, raw };
  }

  return { ok: true, status: response.status, data: raw as T, error: undefined, raw };
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
      variables: input.variables,
    }),
  });

  if (!result.ok) return { ok: false, error: result.error, raw: result.raw };
  const payload = result.data as {
    data?: { id?: string; conversationId?: string };
    id?: string;
    conversationId?: string;
  };
  const inner = payload?.data ?? payload;
  return {
    ok: true,
    messageId: inner?.id,
    conversationId: inner?.conversationId,
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

  if (!result.ok) return { ok: false, error: result.error, raw: result.raw };
  const inner = (result.data as { data?: { id?: string; conversationId?: string } })?.data ??
    (result.data as { id?: string; conversationId?: string });
  return {
    ok: true,
    messageId: inner?.id,
    conversationId: inner?.conversationId,
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

  const variables = [input.name, input.model, settings.businessName, settings.city];
  let lastError: string | undefined;

  if (input.preferTemplate && input.templateId) {
    const template = await sendTemplateMessage(settings, {
      name: input.name,
      phone: input.phone,
      templateId: input.templateId,
      variables,
    });
    if (template.ok) return template;
    lastError = template.error;
  }

  const session = await sendSessionMessage(settings, {
    name: input.name,
    phone: input.phone,
    text: input.text,
  });

  if (session.ok) return session;
  return {
    ok: false,
    error: [lastError, session.error].filter(Boolean).join(" | ") || "WhatsApp send failed",
    raw: session.raw,
  };
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
