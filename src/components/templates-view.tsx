"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HarvestedTemplate } from "@/lib/botspace";
import type { HindiTemplate } from "@/lib/hindi-templates";
import type { SequenceStep } from "@/lib/types";

type Payload = {
  language: string;
  mapped: { inquiry: string; booking: string; purchase: string; festive: string };
  sequences: { inquiry: SequenceStep[]; booking: SequenceStep[] };
  usedTemplateIds: string[];
  recommended: HindiTemplate[];
  remote: {
    listed: boolean;
    hasListEndpoint: boolean;
    docsUrl?: string;
    publicPaths?: string[];
    error?: string;
    harvested?: HarvestedTemplate[];
    harvestedFromMessages?: number;
  };
};

function botspaceStatus(row?: HarvestedTemplate) {
  if (row?.body) return "BotSpace पर है";
  if (row?.failedReason) return "BotSpace पर नहीं मिला";
  return "सिंक बाकी";
}

function roleLabel(row: HindiTemplate) {
  if (row.role === "inquiry") return "पहला फॉलो-अप";
  if (row.role === "booking") return "बुकिंग";
  if (row.role === "purchase") return "खरीद";
  return row.category === "MARKETING" ? "फेस्टिव मार्केटिंग" : "फेस्टिव ऑफर";
}

function variableHint(row: HindiTemplate) {
  if (row.variableCount <= 0) return "वेरिएबल नहीं — पूरा मैसेज फिक्स्ड है";
  if (row.variableCount >= 3) {
    return `वेरिएबल: {{1}} = नाम, {{2}} = मॉडल, {{3}} = कैश बोनस / HDFC ऑफर`;
  }
  return `वेरिएबल: {{1}} = नाम, {{2}} = मॉडल`;
}

function copyText(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} कॉपी हो गया`))
    .catch(() => toast.error("कॉपी नहीं हुआ"));
}

type FestivePreview = {
  active: boolean;
  templateId: string;
  eligibleCount: number;
  alreadySent: number;
  purchased: number;
  hdfcOffer: string;
  modelOffers: { model: string; cashBonus: number | null; offer: string }[];
};

export function TemplatesView() {
  const [data, setData] = useState<Payload | null>(null);
  const [festive, setFestive] = useState<FestivePreview | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [blasting, setBlasting] = useState(false);

  const load = () => {
    fetch("/api/templates")
      .then((response) => response.json())
      .then(setData)
      .catch(() => toast.error("टेम्पलेट लोड नहीं हुए"));
    fetch("/api/leads/festive-offer")
      .then((response) => response.json())
      .then(setFestive)
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/templates", { method: "POST" });
      if (!response.ok) throw new Error("Sync failed");
      toast.success("BotSpace टेम्पलेट सिंक हो गए");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (!data) {
    return <p className="text-muted-foreground">टेम्पलेट लोड हो रहे हैं…</p>;
  }

  const harvested = data.remote.harvested ?? [];
  const hindiIds = new Set(data.recommended.map((row) => row.templateId));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">हिंदी टेम्पलेट</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            ऑटो फॉलो-अप के <strong>3 हिंदी UTILITY</strong> टेम्पलेट वैसे ही हैं।
            चौथा <strong>फेस्टिव ऑफर</strong> Meta Approve होते ही अपने आप लीड्स
            पर भेज दिया जाएगा। BotSpace में ID अलग हो तो Settings में सिर्फ वही
            बदलें।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={blasting || !festive?.eligibleCount}
            onClick={async () => {
              setBlasting(true);
              try {
                const response = await fetch("/api/leads/festive-offer", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ limit: 25 }),
                });
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error || "Send failed");
                toast.success(
                  `फेस्टिव भेजा: ${payload.sent} · फेल: ${payload.failed} · बाकी: ${payload.remaining}`,
                );
                load();
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Festive send failed",
                );
              } finally {
                setBlasting(false);
              }
            }}
          >
            {blasting
              ? "भेज रहे हैं…"
              : `फेस्टिव भेजें (${festive?.eligibleCount ?? 0})`}
          </Button>
          <Button onClick={apply} disabled={syncing}>
            {syncing ? "जोड़ रहे हैं…" : "BotSpace से सिंक करें"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BotSpace से पढ़ना</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {data.remote.listed
              ? `BotSpace से ${harvested.filter((row) => row.body).length} टेम्पलेट मिले (Approve होने के बाद यहीं दिखते हैं)।`
              : data.remote.error}
          </p>
          <div className="rounded-lg border border-[#c8102e]/30 bg-[#c8102e]/5 px-3 py-2 text-foreground">
            1) पहला फॉलो-अप — <code>shubham_lead_followup</code> · बटन{" "}
            <strong>बुकिंग</strong>
            <br />
            2) बुकिंग हो जाए — <code>shubham_booking_hi</code> · डिलीवरी पर बटन{" "}
            <strong>खरीद</strong>
            <br />
            3) खरीद / डिलीवरी — <code>shubham_bought_hi</code> · ऑटो फॉलो-अप बंद
            <br />
            4) फेस्टिव मार्केटिंग — <code>herofestiveoffer</code> · Call बटन ·
            कोई वेरिएबल नहीं
            <br />
            5) फेस्टिव UTILITY — <code>shubham_festive_offer</code> · बटन{" "}
            <strong>बुकिंग</strong>
            <br />
            अभी मैप फेस्टिव: <code>{data.mapped.festive}</code>
          </div>
          <p>
            अभी मैप: पूछताछ <code>{data.mapped.inquiry}</code> · बुकिंग{" "}
            <code>{data.mapped.booking}</code> · खरीद{" "}
            <code>{data.mapped.purchase}</code> · फेस्टिव{" "}
            <code>{data.mapped.festive}</code> · भाषा {data.language}
          </p>
          {data.usedTemplateIds.length > 0 ? (
            <p>
              डेस्क में जुड़े IDs:{" "}
              {data.usedTemplateIds.map((id) => (
                <code key={id} className="mr-2">
                  {id}
                </code>
              ))}
            </p>
          ) : null}
          {harvested.length > 0 ? (
            <div className="space-y-2">
              <p className="text-foreground">
                BotSpace टेम्पलेट ({harvested.filter((row) => row.body).length}/
                {harvested.length})
              </p>
              {harvested.map((row) => (
                <div
                  key={`${row.templateId}-${row.language ?? "na"}`}
                  className="rounded-lg border border-border bg-muted/40 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-foreground">{row.templateId}</code>
                    <Badge variant={row.body ? "default" : "secondary"}>
                      {botspaceStatus(row)}
                    </Badge>
                    {row.language ? (
                      <span className="text-xs">{row.language}</span>
                    ) : null}
                    {hindiIds.has(row.templateId) ? (
                      <span className="text-xs">· हिंदी कैटलॉग से मैच</span>
                    ) : null}
                    {row.buttons?.length ? (
                      <span className="text-xs">
                        · बटन: {row.buttons.join(", ")}
                      </span>
                    ) : null}
                  </div>
                  {row.body ? (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">
                      {row.body}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs">
                      {row.failedReason || "BotSpace से बॉडी नहीं मिली"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>
              BotSpace से अभी कोई टेम्पलेट नहीं खिंचा। ऊपर{" "}
              <strong>BotSpace से सिंक करें</strong> दबाएँ
              {data.remote.harvestedFromMessages
                ? ` (${data.remote.harvestedFromMessages} पुराने मैसेज जाँचे)`
                : ""}
              ।
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BotSpace में ये टेम्पलेट बनाएँ</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="pb-2 pr-3">Template ID</th>
                <th className="pb-2 pr-3">भाषा</th>
                <th className="pb-2 pr-3">कैटेगरी</th>
                <th className="pb-2 pr-3">BotSpace</th>
                <th className="pb-2">क्विक रिप्लाई</th>
              </tr>
            </thead>
            <tbody>
              {data.recommended.map((row) => (
                <tr
                  key={row.stepId}
                  className="border-t border-border/70"
                >
                  <td className="py-2 pr-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
                      onClick={() => copyText(row.templateId, "Template ID")}
                    >
                      {row.templateId}
                      <Copy className="size-3" />
                    </button>
                  </td>
                  <td className="py-2 pr-3">hi</td>
                  <td className="py-2 pr-3">
                    {row.category} · {roleLabel(row)}
                  </td>
                  <td className="py-2 pr-3">
                    {botspaceStatus(
                      harvested.find((item) => item.templateId === row.templateId),
                    )}
                  </td>
                  <td className="py-2">{row.buttonLabel ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {data.recommended.map((row) => (
          <Card key={row.stepId}>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{row.nameHi}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Template ID: <code>{row.templateId}</code> · भाषा hi ·{" "}
                  {row.category} · {roleLabel(row)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.buttonLabel ? (
                  <Badge>{row.buttonLabel}</Badge>
                ) : (
                  <Badge variant="secondary">कोई बटन नहीं</Badge>
                )}
                <Badge
                  variant={
                    harvested.find((item) => item.templateId === row.templateId)
                      ?.body
                      ? "default"
                      : "secondary"
                  }
                >
                  {botspaceStatus(
                    harvested.find((item) => item.templateId === row.templateId),
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide uppercase">
                  डेस्क / सेशन मैसेज
                </p>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-xs">
                  {row.sessionBody}
                </pre>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide uppercase">
                    BotSpace में पेस्ट करें (Meta body)
                  </p>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => copyText(row.metaBody, "Meta body")}
                  >
                    कॉपी
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg bg-[#16110f] p-3 text-xs text-[#f7f1e8]">
                  {row.metaBody}
                </pre>
                <p className="mt-2 text-xs text-muted-foreground">
                  {variableHint(row)}
                  {row.buttonLabel ? ` · क्विक रिप्लाई: ${row.buttonLabel}` : ""}
                </p>
                {harvested.find((item) => item.templateId === row.templateId)
                  ?.body ? (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-medium tracking-wide uppercase text-foreground">
                      BotSpace पर यही Approve बॉडी है
                    </p>
                    <pre className="whitespace-pre-wrap rounded-lg border border-[#c8102e]/30 bg-[#c8102e]/5 p-3 text-xs text-foreground">
                      {
                        harvested.find(
                          (item) => item.templateId === row.templateId,
                        )?.body
                      }
                    </pre>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {festive ? (
        <Card>
          <CardHeader>
            <CardTitle>फेस्टिव {"{{3}}"} — मॉडल के हिसाब से</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Hero circular में कैश बोनस वाले मॉडल पर कैश + {festive.hdfcOffer}।
              PDF में नहीं जो मॉडल हैं (Splendor, Passion, Glamour, Super
              Splendor, Xoom, Xpulse 200 4V, Other) उन पर भी {festive.hdfcOffer}।
              BotSpace Approve के बाद Settings में सिर्फ festive Template ID
              बदलें। खरीदी लीड्स को नहीं भेजा जाता।
            </p>
            <p className="text-muted-foreground">
              भेजने लायक: {festive.eligibleCount} · पहले भेजा: {festive.alreadySent}{" "}
              · खरीदी: {festive.purchased} · ID{" "}
              <code>{festive.templateId}</code>
              {festive.active ? "" : " · ऑफर विंडो बंद (20 Oct 2026)"}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead className="text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="pb-2 pr-3">Model</th>
                    <th className="pb-2">{"{{3}}"} भेजा जाएगा</th>
                  </tr>
                </thead>
                <tbody>
                  {festive.modelOffers.map((row) => (
                    <tr key={row.model} className="border-t border-border/70">
                      <td className="py-2 pr-3">{row.model}</td>
                      <td className="py-2 text-xs">{row.offer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
