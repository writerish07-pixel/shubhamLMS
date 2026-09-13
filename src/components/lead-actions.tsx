"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/types";

async function postAction(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  window.dispatchEvent(new Event("leads-updated"));
  return data as { lead: Lead };
}

export function LeadActions({
  lead,
  compact = false,
}: {
  lead: Lead;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const purchased = lead.status === "purchased";

  const run = async (
    key: string,
    path: string,
    success: string,
    body?: unknown,
  ) => {
    setBusy(key);
    try {
      await postAction(path, body);
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size={compact ? "sm" : "default"}
        disabled={purchased || busy !== null}
        onClick={() =>
          run(
            "booked",
            `/api/leads/${lead.id}/booked`,
            "बुकिंग WhatsApp भेजा गया, खरीद बटन के साथ",
          )
        }
      >
        {busy === "booked" ? "भेज रहे हैं…" : "बुकिंग"}
      </Button>
      <Button
        size={compact ? "sm" : "default"}
        variant="secondary"
        disabled={purchased || busy !== null}
        onClick={() =>
          run(
            "purchase",
            `/api/leads/${lead.id}/purchase`,
            "खरीद दर्ज। लीड ऑटो फॉलो-अप से निकल गया।",
          )
        }
      >
        {busy === "purchase" ? "भेज रहे हैं…" : "खरीद"}
      </Button>
      {!compact && lead.autoFollowup && !purchased ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() =>
            run("send", `/api/leads/${lead.id}/send-now`, "WhatsApp sent now")
          }
        >
          Send now
        </Button>
      ) : null}
      {!compact && !purchased ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={busy !== null}
          onClick={() =>
            run(
              "pause",
              `/api/leads/${lead.id}/pause`,
              lead.autoFollowup ? "Follow-up paused" : "Follow-up resumed",
              { paused: lead.autoFollowup },
            )
          }
        >
          {lead.autoFollowup ? "Pause" : "Resume"}
        </Button>
      ) : null}
    </div>
  );
}
