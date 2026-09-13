"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWhen } from "@/lib/format";
import {
  fromIstDatetimeLocal,
  toIstDatetimeLocal,
  tomorrowIst,
} from "@/lib/schedule";
import type { Lead } from "@/lib/types";

export function LeadScheduleCard({ lead }: { lead: Lead }) {
  const [value, setValue] = useState(toIstDatetimeLocal(lead.nextFollowupAt));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(toIstDatetimeLocal(lead.nextFollowupAt));
  }, [lead.nextFollowupAt, lead.id]);

  const save = async (iso: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextFollowupAt: iso }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save time");
      window.dispatchEvent(new Event("leads-updated"));
      toast.success("Next follow-up time saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save time");
    } finally {
      setSaving(false);
    }
  };

  if (lead.status === "purchased") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Follow-up time</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          खरीद हो चुकी है — ऑटो फॉलो-अप बंद है।
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next WhatsApp time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          अभी शेड्यूल: {formatWhen(lead.nextFollowupAt)} · जयपुर समय (IST)
        </p>
        <div className="grid gap-1.5">
          <Label htmlFor="nextAt">तारीख और समय</Label>
          <Input
            id="nextAt"
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={saving || !value}
            onClick={() => {
              const iso = fromIstDatetimeLocal(value);
              if (iso) void save(iso);
            }}
          >
            {saving ? "Saving…" : "Save time"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => void save(new Date(Date.now() + 60 * 60 * 1000).toISOString())}
          >
            1 घंटे बाद
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => void save(tomorrowIst(11, 0).toISOString())}
          >
            कल 11:00
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() => void save(new Date().toISOString())}
          >
            अभी भेजो
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
