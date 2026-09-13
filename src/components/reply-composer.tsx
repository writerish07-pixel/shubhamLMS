"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUICK = [
  "जी, शुभम मोटर्स जयपुर से बात हो रही है। कैसे मदद करें?",
  "शोरूम आ जाएँ — टेस्ट राइड तैयार है।",
  "ऑन-रोड कीमत और ईएमआई बताते हैं, मॉडल कन्फर्म कीजिए।",
];

export function ReplyComposer({
  leadId,
  compact = false,
}: {
  leadId: string;
  compact?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (value = text) => {
    const body = value.trim();
    if (!body) return;
    setSending(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.result?.error || "Reply failed");
      }
      setText("");
      window.dispatchEvent(new Event("leads-updated"));
      toast.success(data.result?.simulated ? "Saved locally (live WhatsApp off)" : "WhatsApp भेज दिया");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reply failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-border bg-card p-3">
      {!compact ? (
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full bg-muted px-2.5 py-1 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setText(item)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <Textarea
          rows={compact ? 2 : 3}
          value={text}
          placeholder="यहाँ जवाब लिखें — यह व्हाट्सऐप पर जाएगा"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <Button
          className="shrink-0"
          disabled={sending || !text.trim()}
          onClick={() => void send()}
        >
          <Send className="size-4" />
          {sending ? "…" : "भेजें"}
        </Button>
      </div>
    </div>
  );
}
