import { NextResponse } from "next/server";
import { inspectBotspaceTemplates } from "@/lib/botspace";
import { applyHindiTemplateCatalog, HINDI_TEMPLATES, LEAD_FOLLOWUP_TEMPLATE_ID } from "@/lib/hindi-templates";
import { withStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await withStore((store) => ({
    settings: store.settings,
    inquirySequence: store.inquirySequence,
    bookingSequence: store.bookingSequence,
    usedTemplateIds: [
      ...new Set(
        [
          store.settings.inquiryTemplateId,
          store.settings.bookingTemplateId,
          store.settings.purchaseTemplateId,
          ...store.inquirySequence.map((step) => step.templateId),
          ...store.bookingSequence.map((step) => step.templateId),
          ...store.messages
            .map((message) => message.templateId)
            .filter((id): id is string => Boolean(id)),
        ].filter(Boolean),
      ),
    ],
    messageIds: store.messages
      .map((message) => message.botspaceMessageId)
      .filter((id): id is string => Boolean(id)),
  }));

  const remote = await inspectBotspaceTemplates(
    snapshot.settings,
    snapshot.messageIds,
  );

  return NextResponse.json({
    language: snapshot.settings.templateLanguage ?? "hi",
    mapped: {
      inquiry: snapshot.settings.inquiryTemplateId,
      booking: snapshot.settings.bookingTemplateId,
      purchase: snapshot.settings.purchaseTemplateId,
    },
    sequences: {
      inquiry: snapshot.inquirySequence,
      booking: snapshot.bookingSequence,
    },
    usedTemplateIds: snapshot.usedTemplateIds,
    recommended: [...HINDI_TEMPLATES].sort((a, b) => {
      const rank = (row: (typeof HINDI_TEMPLATES)[number]) =>
        row.templateId === LEAD_FOLLOWUP_TEMPLATE_ID
          ? 0
          : row.category === "UTILITY"
            ? 1
            : 2;
      return rank(a) - rank(b);
    }),
    remote,
  });
}

export async function POST() {
  const data = await withStore((store) => {
    applyHindiTemplateCatalog(store);
    return {
      settings: {
        inquiryTemplateId: store.settings.inquiryTemplateId,
        bookingTemplateId: store.settings.bookingTemplateId,
        purchaseTemplateId: store.settings.purchaseTemplateId,
        templateLanguage: store.settings.templateLanguage,
      },
      inquirySequence: store.inquirySequence,
      bookingSequence: store.bookingSequence,
    };
  });
  return NextResponse.json({ ok: true, ...data });
}
