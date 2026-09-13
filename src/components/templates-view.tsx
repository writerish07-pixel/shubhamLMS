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
  mapped: { inquiry: string; booking: string; purchase: string };
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

function copyText(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} कॉपी हो गया`))
    .catch(() => toast.error("कॉपी नहीं हुआ"));
}

export function TemplatesView() {
  const [data, setData] = useState<Payload | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    fetch("/api/templates")
      .then((response) => response.json())
      .then(setData)
      .catch(() => toast.error("टेम्पलेट लोड नहीं हुए"));
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/templates", { method: "POST" });
      if (!response.ok) throw new Error("Sync failed");
      toast.success("हिंदी टेम्पलेट फॉलो-अप से जुड़ गए");
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
            लीड फॉलो-अप <strong>UTILITY</strong> टेम्पलेट से भेजें — Marketing
            टेम्पलेट Meta अक्सर डिलीवर नहीं करता (error 131049)। नीचे हिंदी
            UTILITY फॉलो-अप BotSpace में बनाएँ (भाषा <strong>Hindi / hi</strong>
            , बटन <strong>बुकिंग</strong>), फिर <strong>फॉलो-अप से सिंक करें</strong>।
          </p>
        </div>
        <Button onClick={apply} disabled={syncing}>
          {syncing ? "जोड़ रहे हैं…" : "फॉलो-अप से सिंक करें"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BotSpace से पढ़ना</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {data.remote.listed
              ? "Remote templates loaded."
              : data.remote.error}
          </p>
          <div className="rounded-lg border border-[#c8102e]/30 bg-[#c8102e]/5 px-3 py-2 text-foreground">
            व्हाट्सऐप फेल होने की वजह: पूछताछ मार्केटिंग टेम्पलेट + गलत वेरिएबल
            संख्या (4 भेजे, टेम्पलेट में 2) + 24 घंटे के बाहर सेशन मैसेज। अब डेस्क{" "}
            <code>shubham_lead_followup_hi</code> UTILITY भेजता है, केवल{" "}
            {"{{1}}"} नाम और {"{{2}}"} मॉडल, और सेशन मैसेज तभी जब ग्राहक ने 24 घंटे
            में जवाब दिया हो।
          </div>
          <p>
            अभी मैप: पूछताछ <code>{data.mapped.inquiry}</code> · बुकिंग{" "}
            <code>{data.mapped.booking}</code> · खरीद{" "}
            <code>{data.mapped.purchase}</code> · भाषा {data.language}
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
                भेजे गए मैसेज से मिले टेम्पलेट ({harvested.length})
              </p>
              {harvested.map((row) => (
                <div
                  key={`${row.templateId}-${row.language ?? "na"}`}
                  className="rounded-lg border border-border bg-muted/40 px-3 py-2"
                >
                  <code className="text-foreground">{row.templateId}</code>
                  {row.language ? ` · ${row.language}` : ""}
                  {hindiIds.has(row.templateId) ? " · हिंदी कैटलॉग से मैच" : ""}
                  {row.buttons?.length ? ` · बटन: ${row.buttons.join(", ")}` : ""}
                  {row.body ? (
                    <p className="mt-1 whitespace-pre-wrap text-xs">{row.body}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p>
              अभी BotSpace इनबॉक्स से कोई पुराना टेम्पलेट ID नहीं मिला
              {data.remote.harvestedFromMessages
                ? ` (${data.remote.harvestedFromMessages} मैसेज जाँचे)`
                : ""}
              । नीचे हिंदी कैटलॉग वही IDs हैं जो डेस्क भेजेगा।
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
                    {row.category}
                    {row.templateId === "shubham_lead_followup_hi"
                      ? " · लीड फॉलो-अप (पहले यह बनाएँ)"
                      : row.category === "MARKETING"
                        ? " · ऑटो सीक्वेंस में नहीं"
                        : ""}
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
                  {row.category} ·{" "}
                  {row.role === "inquiry"
                    ? "पूछताछ"
                    : row.role === "followup"
                      ? "लीड फॉलो-अप"
                      : row.role === "booking"
                        ? "बुकिंग"
                        : "खरीद"}
                </p>
              </div>
              <div className="flex gap-2">
                {row.templateId === "shubham_lead_followup_hi" ? (
                  <Badge>पहले यह बनाएँ</Badge>
                ) : null}
                {row.buttonLabel ? (
                  <Badge>{row.buttonLabel}</Badge>
                ) : (
                  <Badge variant="secondary">कोई बटन नहीं</Badge>
                )}
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
                  वेरिएबल: {"{{1}}"} = नाम, {"{{2}}"} = मॉडल
                  {row.buttonLabel ? ` · क्विक रिप्लाई: ${row.buttonLabel}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
