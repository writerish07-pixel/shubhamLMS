import { sendLeadWhatsApp } from "@/lib/botspace";
import { interpolate } from "@/lib/copy";
import { festiveOfferLine } from "@/lib/festive-offer";
import {
  isFestiveTemplate,
  LEAD_FOLLOWUP_TEMPLATE_ID,
  templateBodyVariables,
  templateById,
} from "@/lib/hindi-templates";
import { appendMessage, touchLead, withStore } from "@/lib/store";
import { isOpenSessionWindow } from "@/lib/whatsapp-errors";

export async function sendChosenTemplateToLead(leadId: string, templateId: string) {
  const id = templateId.trim();
  if (!id) throw new Error("Choose a WhatsApp template");

  return withStore(async (store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status === "purchased") {
      throw new Error("Purchased leads stay out of campaign WhatsApp");
    }

    const settings = store.settings;
    const row = templateById(id);
    const offer = festiveOfferLine(lead.model);
    const body = interpolate(row?.sessionBody ?? "{{firstName}} जी, {{model}}", lead, settings, {
      cashBonus: offer,
      offer,
    });

    const result = await sendLeadWhatsApp(settings, {
      name: lead.name,
      phone: lead.phone,
      model: lead.model,
      text: body,
      templateId: id,
      preferTemplate: true,
      sessionWindowOpen: isOpenSessionWindow(lead.lastInboundAt),
      variables: templateBodyVariables(id, lead.name, lead.model),
    });

    appendMessage(store, {
      leadId: lead.id,
      direction: "out",
      channel: "whatsapp",
      kind: "template",
      body,
      templateId: id,
      botspaceMessageId: result.messageId,
      status: result.ok ? (result.simulated ? "simulated" : "sent") : "failed",
      error: result.error,
    });

    if (result.ok) {
      lead.lastOutboundAt = new Date().toISOString();
      lead.lastError = null;
      if (isFestiveTemplate(id)) lead.festiveOfferSentAt = lead.lastOutboundAt;
      if (result.conversationId) lead.conversationId = result.conversationId;
      if (result.contactId) lead.contactId = result.contactId;
      if (lead.status === "failed" || lead.status === "exhausted") {
        lead.status = lead.stage === "booking" ? "booked" : "following";
      }
    } else {
      lead.lastError = result.error ?? "WhatsApp send failed";
    }

    touchLead(lead);
    return { lead, result };
  });
}

export async function sendChosenTemplateBlast(leadIds: string[], templateId: string) {
  const unique = [...new Set(leadIds.filter(Boolean))];
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let lastError: string | undefined;

  for (const leadId of unique) {
    try {
      const { result } = await sendChosenTemplateToLead(leadId, templateId);
      if (result.ok) sent += 1;
      else {
        failed += 1;
        lastError = result.error;
      }
    } catch (error) {
      skipped += 1;
      lastError = error instanceof Error ? error.message : "Send failed";
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  return { processed: unique.length, sent, failed, skipped, lastError, templateId };
}

export function isInquiryFollowupTemplate(templateId: string | undefined) {
  return templateId === LEAD_FOLLOWUP_TEMPLATE_ID;
}
