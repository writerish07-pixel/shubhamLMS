import { buttonHint, interpolate } from "@/lib/copy";
import { PURCHASE_THANKS_BODY } from "@/lib/defaults";
import { sendLeadWhatsApp } from "@/lib/botspace";
import { computeFollowupAt } from "@/lib/schedule";
import {
  activeSequence,
  appendMessage,
  touchLead,
  withStore,
} from "@/lib/store";
import type { Lead, SequenceStep, Settings, StoreData } from "@/lib/types";

function nextEnabledStep(steps: SequenceStep[], fromIndex: number) {
  return steps.findIndex((step, index) => index >= fromIndex && step.enabled);
}

function scheduleStep(
  lead: Lead,
  settings: Settings,
  step: SequenceStep,
  from: Date,
  options: { respectWindow?: boolean } = {},
) {
  const immediate = step.delayMinutes <= 0 && !step.sendAtTime;
  lead.nextFollowupAt = computeFollowupAt({
    from,
    delayMinutes: step.delayMinutes,
    sendAtTime: step.sendAtTime,
    windowStart: settings.followupWindowStart || "09:30",
    windowEnd: settings.followupWindowEnd || "20:00",
    respectWindow: options.respectWindow ?? !immediate,
  }).toISOString();
}

function scheduleAfterSend(lead: Lead, store: StoreData, justSentIndex: number) {
  const steps = activeSequence(store, lead.stage === "sold" ? "inquiry" : lead.stage);
  const upcoming = nextEnabledStep(steps, justSentIndex + 1);
  if (upcoming === -1) {
    lead.nextStepIndex = steps.length;
    lead.nextFollowupAt = null;
    if (lead.status === "following" || lead.status === "booked") {
      lead.status = "exhausted";
    }
    return;
  }
  lead.nextStepIndex = upcoming;
  scheduleStep(lead, store.settings, steps[upcoming], new Date(), {
    respectWindow: true,
  });
}

async function deliverStep(
  store: StoreData,
  lead: Lead,
  step: SequenceStep,
  options: { forceTemplate?: boolean } = {},
) {
  const settings = store.settings;
  const templateId =
    step.templateId ||
    (step.button === "purchase"
      ? settings.bookingTemplateId
      : settings.inquiryTemplateId);
  const body = interpolate(step.body, lead, settings) + buttonHint(step);

  const result = await sendLeadWhatsApp(settings, {
    name: lead.name,
    phone: lead.phone,
    model: lead.model,
    text: body,
    templateId,
    preferTemplate: options.forceTemplate ?? true,
  });

  appendMessage(store, {
    leadId: lead.id,
    direction: "out",
    channel: "whatsapp",
    kind: templateId ? "template" : "session",
    body,
    templateId,
    botspaceMessageId: result.messageId,
    status: result.ok ? (result.simulated ? "simulated" : "sent") : "failed",
    error: result.error,
  });

  if (result.ok) {
    lead.lastOutboundAt = new Date().toISOString();
    lead.lastError = null;
    if (result.conversationId) lead.conversationId = result.conversationId;
    if (result.contactId) lead.contactId = result.contactId;
    if (lead.status === "failed") {
      lead.status = lead.stage === "booking" ? "booked" : "following";
    }
  } else {
    lead.lastError = result.error ?? "WhatsApp send failed";
    lead.status = "failed";
  }

  touchLead(lead);
  return result;
}

export async function processDueFollowups(limit = 20) {
  const dueIds = await withStore((store) => {
    const now = Date.now();
    return store.leads
      .filter(
        (lead) =>
          lead.autoFollowup &&
          lead.nextFollowupAt &&
          new Date(lead.nextFollowupAt).getTime() <= now &&
          lead.status !== "purchased" &&
          lead.status !== "paused",
      )
      .slice(0, limit)
      .map((lead) => lead.id);
  });

  let sent = 0;
  let failed = 0;

  for (const leadId of dueIds) {
    const outcome = await withStore(async (store) => {
      const lead = store.leads.find((item) => item.id === leadId);
      if (!lead || !lead.autoFollowup || lead.status === "purchased" || lead.status === "paused") {
        return "skip" as const;
      }
      if (!lead.nextFollowupAt || new Date(lead.nextFollowupAt).getTime() > Date.now()) {
        return "skip" as const;
      }

      const steps = activeSequence(store, lead.stage);
      const step = steps[lead.nextStepIndex];
      if (!step) {
        lead.nextFollowupAt = null;
        lead.status = "exhausted";
        touchLead(lead);
        return "skip" as const;
      }

      lead.nextFollowupAt = null;
      const result = await deliverStep(store, lead, step);
      if (result.ok) {
        scheduleAfterSend(lead, store, lead.nextStepIndex);
        return "sent" as const;
      }
      lead.nextFollowupAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return "failed" as const;
    });

    if (outcome === "sent") sent += 1;
    if (outcome === "failed") failed += 1;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  return { processed: dueIds.length, sent, failed };
}

export async function sendNow(leadId: string) {
  return withStore(async (store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    if (!lead.autoFollowup || lead.status === "purchased") {
      throw new Error("This lead is out of auto follow-up");
    }
    const steps = activeSequence(store, lead.stage);
    const step = steps[lead.nextStepIndex] ?? steps.at(-1);
    if (!step) throw new Error("No follow-up step left");
    const result = await deliverStep(store, lead, step);
    if (result.ok) scheduleAfterSend(lead, store, lead.nextStepIndex);
    return { lead, result };
  });
}

export async function markBooked(leadId: string, source: "staff" | "whatsapp") {
  return withStore(async (store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status === "purchased") {
      throw new Error("Lead already purchased and is out of auto follow-up");
    }

    if (lead.stage === "booking" && lead.bookedAt) {
      appendMessage(store, {
        leadId: lead.id,
        direction: source === "whatsapp" ? "in" : "out",
        channel: source === "whatsapp" ? "whatsapp" : "system",
        kind: source === "whatsapp" ? "button" : "system",
        body: "Booked button pressed again. Booking follow-up already running.",
        status: source === "whatsapp" ? "received" : "sent",
      });
      return lead;
    }

    lead.stage = "booking";
    lead.status = "booked";
    lead.autoFollowup = true;
    lead.bookedAt = new Date().toISOString();
    lead.nextStepIndex = 0;
    lead.nextFollowupAt = new Date().toISOString();
    lead.lastError = null;
    touchLead(lead);

    appendMessage(store, {
      leadId: lead.id,
      direction: source === "whatsapp" ? "in" : "out",
      channel: source === "whatsapp" ? "whatsapp" : "system",
      kind: source === "whatsapp" ? "button" : "system",
      body: "Booked button pressed. Booking WhatsApp with Purchase button will be sent.",
      status: source === "whatsapp" ? "received" : "sent",
    });

    const step = activeSequence(store, "booking")[0];
    if (step) {
      const result = await deliverStep(store, lead, step);
      if (result.ok) scheduleAfterSend(lead, store, 0);
    }

    return lead;
  });
}

export async function markPurchased(leadId: string, source: "staff" | "whatsapp") {
  return withStore(async (store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");

    lead.stage = "sold";
    lead.status = "purchased";
    lead.autoFollowup = false;
    lead.nextFollowupAt = null;
    lead.purchasedAt = new Date().toISOString();
    touchLead(lead);

    appendMessage(store, {
      leadId: lead.id,
      direction: source === "whatsapp" ? "in" : "out",
      channel: source === "whatsapp" ? "whatsapp" : "system",
      kind: source === "whatsapp" ? "button" : "system",
      body: "Purchase button pressed. Lead is now out of auto follow-up.",
      status: source === "whatsapp" ? "received" : "sent",
    });

    const settings = store.settings;
    const body = interpolate(PURCHASE_THANKS_BODY, lead, settings);
    const result = await sendLeadWhatsApp(settings, {
      name: lead.name,
      phone: lead.phone,
      model: lead.model,
      text: body,
      templateId: settings.purchaseTemplateId,
      preferTemplate: true,
    });

    appendMessage(store, {
      leadId: lead.id,
      direction: "out",
      channel: "whatsapp",
      kind: "template",
      body,
      templateId: settings.purchaseTemplateId,
      botspaceMessageId: result.messageId,
      status: result.ok ? (result.simulated ? "simulated" : "sent") : "failed",
      error: result.error,
    });

    if (!result.ok) lead.lastError = result.error ?? "Purchase thank-you WhatsApp failed";
    else lead.lastOutboundAt = new Date().toISOString();

    return lead;
  });
}

export function detectWhatsAppAction(text: string): "booked" | "purchase" | null {
  const value = text.toLowerCase().trim();
  if (!value) return null;
  if (
    /\bpurchase[d]?\b/.test(value) ||
    /\bbought\b/.test(value) ||
    /\bbuy\b/.test(value) ||
    value.includes("खरीद") ||
    value.includes("पेमेंट") ||
    value === "sold"
  ) {
    return "purchase";
  }
  if (
    /\bbooked\b/.test(value) ||
    /\bbooking\b/.test(value) ||
    /^book$/.test(value) ||
    value.includes("बुक") ||
    value.includes("बुकिंग")
  ) {
    return "booked";
  }
  return null;
}

export async function enqueueImportedLead(store: StoreData, lead: Lead, startNow: boolean) {
  if (!startNow) {
    lead.autoFollowup = false;
    lead.nextFollowupAt = null;
    lead.status = "paused";
    return;
  }
  lead.autoFollowup = true;
  lead.stage = "inquiry";
  lead.status = "following";
  lead.nextStepIndex = 0;
  const first = activeSequence(store, "inquiry")[0];
  if (first) {
    scheduleStep(lead, store.settings, first, new Date());
  } else {
    lead.nextFollowupAt = new Date().toISOString();
  }
}

export async function setLeadSchedule(leadId: string, nextFollowupAt: string | null) {
  return withStore((store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status === "purchased") {
      throw new Error("Purchased leads stay out of auto follow-up");
    }
    lead.autoFollowup = true;
    if (lead.status === "paused" || lead.status === "exhausted") {
      lead.status = lead.stage === "booking" ? "booked" : "following";
    }
    lead.nextFollowupAt = nextFollowupAt;
    touchLead(lead);
    return lead;
  });
}

export function rescheduleWaitingLeads(store: StoreData) {
  const now = Date.now();
  for (const lead of store.leads) {
    if (!lead.autoFollowup || lead.status === "purchased" || lead.status === "paused") {
      continue;
    }
    const steps = activeSequence(store, lead.stage);
    const step = steps[lead.nextStepIndex];
    if (!step) continue;
    const from = lead.lastOutboundAt ? new Date(lead.lastOutboundAt) : new Date();
    scheduleStep(lead, store.settings, step, from, { respectWindow: true });
    if (lead.nextFollowupAt && new Date(lead.nextFollowupAt).getTime() < now) {
      lead.nextFollowupAt = new Date().toISOString();
    }
    touchLead(lead);
  }
}

export async function setLeadPaused(leadId: string, paused: boolean) {
  return withStore((store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status === "purchased") throw new Error("Purchased leads stay out of auto follow-up");
    if (paused) {
      lead.status = "paused";
      lead.autoFollowup = false;
      lead.nextFollowupAt = null;
    } else {
      lead.autoFollowup = true;
      lead.status = lead.stage === "booking" ? "booked" : "following";
      const steps = activeSequence(store, lead.stage);
      const step = steps[lead.nextStepIndex] ?? steps[0];
      if (step) {
        lead.nextStepIndex = steps[lead.nextStepIndex] ? lead.nextStepIndex : 0;
        scheduleStep(lead, store.settings, step, new Date());
      } else {
        lead.nextFollowupAt = new Date().toISOString();
      }
    }
    touchLead(lead);
    return lead;
  });
}
