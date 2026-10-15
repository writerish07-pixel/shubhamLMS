import { sendLeadWhatsApp } from "@/lib/botspace";
import { interpolate } from "@/lib/copy";
import {
  festiveEligible,
  festiveOfferActive,
  festiveOfferLine,
} from "@/lib/festive-offer";
import {
  FESTIVE_TEMPLATE_ID,
  templateBodyVariables,
  templateById,
  templateByRole,
} from "@/lib/hindi-templates";
import { appendMessage, touchLead, withStore } from "@/lib/store";
import { isOpenSessionWindow } from "@/lib/whatsapp-errors";
import type { Lead, StoreData } from "@/lib/types";

const FESTIVE_BODY =
  templateByRole("festive")?.sessionBody ??
  "नमस्ते {{firstName}} जी, शुभम मोटर्स जयपुर से Hero Festive 2026 ऑफर है। आपकी {{model}} पर {{cashBonus}}।";

let festiveHoldUntil = 0;

export function isTemplatePendingApproval(error?: string): boolean {
  return /in review|not approved|132001|template does not exist|pending/i.test(
    error || "",
  );
}

export function shouldHoldFestive(error?: string): boolean {
  return (
    isTemplatePendingApproval(error) ||
    /131049|healthy ecosystem/i.test(error || "")
  );
}

export function festiveHoldActive(): boolean {
  return Date.now() < festiveHoldUntil;
}

function holdFestiveForApproval() {
  festiveHoldUntil = Date.now() + 8 * 60 * 1000;
}

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
  const copy = templateById(templateId)?.sessionBody ?? FESTIVE_BODY;
  const body = interpolate(copy, lead, settings, { cashBonus: offer, offer });

  const result = await sendLeadWhatsApp(settings, {
    name: lead.name,
    phone: lead.phone,
    model: lead.model,
    text: body,
    templateId,
    preferTemplate: true,
    sessionWindowOpen: isOpenSessionWindow(lead.lastInboundAt),
    variables: templateBodyVariables(templateId, lead.name, lead.model),
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
  let lastError: string | undefined;

  for (const leadId of dueIds) {
    const outcome = await withStore(async (store) => {
      const lead = store.leads.find((item) => item.id === leadId);
      if (!lead || !festiveEligible(lead)) return "skip" as const;
      const result = await deliverFestive(store, lead);
      return result;
    });
    if (outcome === "skip") continue;
    if (outcome.ok) sent += 1;
    else {
      failed += 1;
      lastError = outcome.error;
      if (shouldHoldFestive(outcome.error)) {
        holdFestiveForApproval();
        break;
      }
    }
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
    lastError,
    waitingForApproval: Boolean(lastError && shouldHoldFestive(lastError)),
  };
}

export async function processDueFestiveOffers(limit = 8) {
  if (!festiveOfferActive() || festiveHoldActive()) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      remaining: 0,
      skipped: true as const,
      waitingForApproval: festiveHoldActive(),
    };
  }

  const enabled = await withStore(
    (store) => store.settings.festiveAutoSend !== false && store.settings.liveWhatsApp,
  );
  if (!enabled) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      remaining: 0,
      skipped: true as const,
      waitingForApproval: false,
    };
  }

  return sendFestiveOfferBlast(limit);
}
