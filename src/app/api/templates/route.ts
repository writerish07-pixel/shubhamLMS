import { NextResponse } from "next/server";
import { inspectBotspaceTemplates } from "@/lib/botspace";
import { applyHindiTemplateCatalog, HINDI_TEMPLATES } from "@/lib/hindi-templates";
import { withStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadTemplates(refresh = false) {
  const snapshot = await withStore((store) => ({
    settings: store.settings,
    inquirySequence: store.inquirySequence,
    bookingSequence: store.bookingSequence,
    botspaceTemplates: store.botspaceTemplates ?? [],
    usedTemplateIds: [
      ...new Set(
        [
          store.settings.inquiryTemplateId,
          store.settings.bookingTemplateId,
          store.settings.purchaseTemplateId,
          store.settings.festiveTemplateId,
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
    {
      cached: snapshot.botspaceTemplates,
      catalogIds: [
        snapshot.settings.inquiryTemplateId,
        snapshot.settings.bookingTemplateId,
        snapshot.settings.purchaseTemplateId,
        snapshot.settings.festiveTemplateId,
        ...HINDI_TEMPLATES.map((row) => row.templateId),
      ],
      refresh,
    },
  );

  await withStore((store) => {
    store.botspaceTemplates = remote.harvested;
  });

  return {
    language: snapshot.settings.templateLanguage ?? "hi",
    mapped: {
      inquiry: snapshot.settings.inquiryTemplateId,
      booking: snapshot.settings.bookingTemplateId,
      purchase: snapshot.settings.purchaseTemplateId,
      festive: snapshot.settings.festiveTemplateId,
    },
    sequences: {
      inquiry: snapshot.inquirySequence,
      booking: snapshot.bookingSequence,
    },
    usedTemplateIds: snapshot.usedTemplateIds,
    recommended: HINDI_TEMPLATES,
    remote,
  };
}

export async function GET() {
  return NextResponse.json(await loadTemplates(false));
}

export async function POST() {
  await withStore((store) => {
    applyHindiTemplateCatalog(store);
  });
  const data = await loadTemplates(true);
  return NextResponse.json({ ok: true, ...data });
}
