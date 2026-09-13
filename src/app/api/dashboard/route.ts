import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await readStore();
  const now = Date.now();
  const leads = store.leads;

  const stats = {
    total: leads.length,
    following: leads.filter((lead) => lead.status === "following").length,
    booked: leads.filter((lead) => lead.status === "booked").length,
    purchased: leads.filter((lead) => lead.status === "purchased").length,
    paused: leads.filter((lead) => lead.status === "paused").length,
    failed: leads.filter((lead) => lead.status === "failed").length,
    dueNow: leads.filter(
      (lead) =>
        lead.autoFollowup &&
        lead.nextFollowupAt &&
        new Date(lead.nextFollowupAt).getTime() <= now,
    ).length,
    liveWhatsApp: store.settings.liveWhatsApp,
    unread: leads.reduce((sum, lead) => sum + (lead.unreadCount ?? 0), 0),
  };

  const dueSoon = [...leads]
    .filter((lead) => lead.autoFollowup && lead.nextFollowupAt)
    .sort(
      (a, b) =>
        new Date(a.nextFollowupAt ?? 0).getTime() -
        new Date(b.nextFollowupAt ?? 0).getTime(),
    )
    .slice(0, 8);

  return NextResponse.json({
    stats,
    dueSoon,
    recentLeads: leads.slice(0, 8),
    recentMessages: store.messages.slice(0, 12),
    settings: {
      businessName: store.settings.businessName,
      city: store.settings.city,
      channelPhone: store.settings.channelPhone,
      channelId: store.settings.channelId,
      liveWhatsApp: store.settings.liveWhatsApp,
    },
  });
}
