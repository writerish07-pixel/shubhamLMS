import { sendLeadWhatsApp } from "@/lib/botspace";
import { interpolate } from "@/lib/copy";
import {
  festiveEligible,
  festiveOfferActive,
  festiveOfferLine,
} from "@/lib/festive-offer";
import { FESTIVE_TEMPLATE_ID, templateByRole } from "@/lib/hindi-templates";
import { appendMessage, touchLead, withStore } from "@/lib/store";
import { isOpenSessionWindow } from "@/lib/whatsapp-errors";
import type { Lead, StoreData } from "@/lib/types";

const FESTIVE_BODY =
  templateByRole("festive")?.sessionBody ??
  "नमस्ते {{firstName}} जी, शुभम मोटर्स जयपुर से Hero Festive 2026 ऑफर है। आपकी {{model}} पर {{cashBonus}}।";

export async function festiveOfferPreview() {
  return withStore((store) => {
    const eligible = store.leads.filter(festiveEligible);
    return {
      active: festiveOfferActive(),
      templateId: store.settings.festiveTemplateId || FESTIVE_TEMPLATE_ID,
      eligibleCount: eligible.length,
      alreadySent: store.leads.filter((lead) => Boolean(lead.festiveOfferSentAt)).length,
      purchased: store.leads.filter((lead) => lead.status === "purchased").length,
      total: store.leads.length,
    };
  });
}

async function deliverFestive(store: StoreData, lead: Lead) {
  const settings = store.settings;
  const templateId = settings.festiveTemplateId?.trim() || FESTIVE_TEMPLATE_ID;
  const offer = festiveOfferLine(lead.model);
  const firstName = lead.name.trim().split(/\s+/)[0] || lead.name.trim();
  const body = interpolate(FESTIVE_BODY, lead, settings, { cashBonus: offer, offer });

  const result = await sendLeadWhatsApp(settings, {
    name: lead.name,
    phone: lead.phone,
    model: lead.model,
    text: body,
    templateId,
    preferTemplate: true,
    sessionWindowOpen: isOpenSessionWindow(lead.lastInboundAt),
    variables: [firstName, lead.model, offer],
  });

  appendMessage(store, {
    leadId: lead.id,
    direction: "out",
    channel: "whatsapp",
    kind: "template",
    body,
    templateId,
    botspaceMessageId: result.messageId,
    status: result.ok ? (result.simulated ? "simulated" : "sent") : "failed",
    error: result.error,
  });

  if (result.ok) {
    lead.festiveOfferSentAt = new Date().toISOString();
    lead.lastOutboundAt = lead.festiveOfferSentAt;
    if (result.conversationId) lead.conversationId = result.conversationId;
    if (result.contactId) lead.contactId = result.contactId;
  }

  touchLead(lead);
  return result;
}

export async function sendFestiveOfferToLead(leadId: string, force = false) {
  if (!festiveOfferActive()) {
    throw new Error("Hero Festive 2026 offer ended on 20 Oct 2026.");
  }

  return withStore(async (store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status === "purchased") {
      throw new Error("Purchased leads are out of festive WhatsApp");
    }
    if (lead.festiveOfferSentAt && !force) {
      throw new Error("Festive offer already sent to this lead");
    }

    const result = await deliverFestive(store, lead);
    return { lead, result };
  });
}

export async function sendFestiveOfferBlast(limit = 25) {
  if (!festiveOfferActive()) {
    throw new Error("Hero Festive 2026 offer ended on 20 Oct 2026.");
  }

  const dueIds = await withStore((store) =>
    store.leads.filter(festiveEligible).slice(0, limit).map((lead) => lead.id),
  );

  let sent = 0;
  let failed = 0;

  for (const leadId of dueIds) {
    const outcome = await withStore(async (store) => {
      const lead = store.leads.find((item) => item.id === leadId);
      if (!lead || !festiveEligible(lead)) return "skip" as const;
      const result = await deliverFestive(store, lead);
      return result.ok ? ("sent" as const) : ("failed" as const);
    });
    if (outcome === "sent") sent += 1;
    if (outcome === "failed") failed += 1;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const remaining = await withStore(
    (store) => store.leads.filter(festiveEligible).length,
  );

  return {
    processed: dueIds.length,
    sent,
    failed,
    remaining,
  };
}
