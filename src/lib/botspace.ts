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
