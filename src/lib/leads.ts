import { enqueueImportedLead } from "@/lib/followup";
import { findLeadByPhone, touchLead, withStore } from "@/lib/store";
import type { Lead } from "@/lib/types";

export type NewLeadInput = {
  name: string;
  phone: string;
  model: string;
  source: Lead["source"];
  notes?: string;
  startFollowup?: boolean;
};

export async function createLeads(
  inputs: NewLeadInput[],
): Promise<{ created: Lead[]; skipped: { phone: string; reason: string }[] }> {
  return withStore((store) => {
    const created: Lead[] = [];
    const skipped: { phone: string; reason: string }[] = [];
    const now = new Date().toISOString();

    for (const input of inputs) {
      const existing = findLeadByPhone(store, input.phone);
      if (existing) {
        skipped.push({
          phone: input.phone,
          reason: `Already on file as ${existing.name} (${existing.status})`,
        });
        continue;
      }

      const lead: Lead = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        phone: input.phone,
        model: input.model.trim(),
        status: "following",
        stage: "inquiry",
        autoFollowup: true,
        nextFollowupAt: now,
        nextStepIndex: 0,
        lastOutboundAt: null,
        lastInboundAt: null,
        unreadCount: 0,
        lastReadAt: null,
        conversationId: null,
        contactId: null,
        bookedAt: null,
        purchasedAt: null,
        createdAt: now,
        updatedAt: now,
        lastError: null,
        source: input.source,
        notes: input.notes ?? "",
      };

      enqueueImportedLead(store, lead, input.startFollowup !== false);
      store.leads.unshift(lead);
      created.push(lead);
    }

    return { created, skipped };
  });
}

export async function updateLead(
  leadId: string,
  patch: Partial<Pick<Lead, "name" | "model" | "notes">>,
) {
  return withStore((store) => {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) throw new Error("Lead not found");
    if (patch.name) lead.name = patch.name.trim();
    if (patch.model) lead.model = patch.model.trim();
    if (patch.notes !== undefined) lead.notes = patch.notes;
    touchLead(lead);
    return lead;
  });
}
