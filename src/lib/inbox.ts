import { sendLeadWhatsApp } from "@/lib/botspace";
import type { ParsedInbound } from "@/lib/inbound";
import { displayPhone } from "@/lib/phones";
import {
  appendMessage,
  findLeadByPhone,
  touchLead,
  withStore,
} from "@/lib/store";
import type { Lead, MessageLog } from "@/lib/types";

export type InboxThread = {
  lead: Lead;
  lastMessage: MessageLog | null;
};

function bumpFollowup(lead: Lead) {
  if (!lead.autoFollowup || !lead.nextFollowupAt) return;
  const minDelay = Date.now() + 4 * 60 * 60 * 1000;
  if (new Date(lead.nextFollowupAt).getTime() < minDelay) {
    lead.nextFollowupAt = new Date(minDelay).toISOString();
  }
}

export function ensureLeadShape(lead: Lead): Lead {
  if (typeof lead.unreadCount !== "number") lead.unreadCount = 0;
  if (lead.lastReadAt === undefined) lead.lastReadAt = null;
  return lead;
}

export function createInboundLead(
  phone: string,
  name: string | null,
): Lead {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name?.trim() || `WhatsApp ${displayPhone(phone)}`,
    phone,
    model: "Other / Not sure",
    status: "paused",
    stage: "inquiry",
    autoFollowup: false,
    nextFollowupAt: null,
    nextStepIndex: 0,
    lastOutboundAt: null,
    lastInboundAt: now,
    unreadCount: 0,
    lastReadAt: null,
    conversationId: null,
    contactId: null,
    bookedAt: null,
    purchasedAt: null,
    createdAt: now,
    updatedAt: now,
    lastError: null,
    source: "webhook",
    notes: "Created from incoming WhatsApp so staff can reply in this desk.",
  };
}

export async function recordInbound(parsed: ParsedInbound) {
  return withStore((store) => {
    let lead = findLeadByPhone(store, parsed.phone);
    let created = false;
    if (!lead) {
      lead = createInboundLead(parsed.phone, parsed.name);
      store.leads.unshift(lead);
      created = true;
    }
    ensureLeadShape(lead);
    if (parsed.name && lead.name.startsWith("WhatsApp ")) {
      lead.name = parsed.name;
    }
    if (parsed.conversationId) lead.conversationId = parsed.conversationId;
    lead.lastInboundAt = new Date().toISOString();
    lead.unreadCount += 1;
    appendMessage(store, {
      leadId: lead.id,
      direction: "in",
      channel: "whatsapp",
      kind: "session",
      body: parsed.text,
      status: "received",
    });
    touchLead(lead);
    return { lead, created };
  });
}

export async function sendStaffReply(leadId: string, text: string) {
  const body = text.trim();
  if (!body) throw new Error("Type a reply first.");

  return withStore(async (store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    ensureLeadShape(lead);

    const result = await sendLeadWhatsApp(store.settings, {
      name: lead.name,
      phone: lead.phone,
      model: lead.model,
      text: body,
      preferTemplate: false,
    });

    appendMessage(store, {
      leadId: lead.id,
      direction: "out",
      channel: "whatsapp",
      kind: "session",
      body,
      botspaceMessageId: result.messageId,
      status: result.ok ? (result.simulated ? "simulated" : "sent") : "failed",
      error: result.error,
    });

    if (result.ok) {
      lead.lastOutboundAt = new Date().toISOString();
      lead.lastError = null;
      if (result.conversationId) lead.conversationId = result.conversationId;
      bumpFollowup(lead);
    } else {
      lead.lastError = result.error ?? "Reply failed";
    }
    lead.unreadCount = 0;
    lead.lastReadAt = new Date().toISOString();
    touchLead(lead);
    return { lead, result };
  });
}

export async function markLeadRead(leadId: string) {
  return withStore((store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    ensureLeadShape(lead);
    lead.unreadCount = 0;
    lead.lastReadAt = new Date().toISOString();
    touchLead(lead);
    return lead;
  });
}

export async function listInbox() {
  return withStore((store) => {
    const threads: InboxThread[] = store.leads.map((lead) => {
      ensureLeadShape(lead);
      const lastMessage =
        store.messages.find((message) => message.leadId === lead.id) ?? null;
      return { lead, lastMessage };
    });
    threads.sort((a, b) => {
      const aTime = new Date(
        a.lastMessage?.createdAt ?? a.lead.updatedAt,
      ).getTime();
      const bTime = new Date(
        b.lastMessage?.createdAt ?? b.lead.updatedAt,
      ).getTime();
      return bTime - aTime;
    });
    const unread = threads.reduce((sum, thread) => sum + thread.lead.unreadCount, 0);
    return { threads, unread };
  });
}
