"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDelay } from "@/lib/format";
import type { SequenceStep } from "@/lib/types";

export function SequenceView() {
  const [inquiry, setInquiry] = useState<SequenceStep[]>([]);
  const [booking, setBooking] = useState<SequenceStep[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/sequence")
      .then((response) => response.json())
      .then((data) => {
        setInquiry(data.inquirySequence ?? []);
        setBooking(data.bookingSequence ?? []);
      })
      .catch(() => toast.error("Could not load sequence"));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/sequence", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquirySequence: inquiry,
          bookingSequence: booking,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      toast.success("Follow-up copy saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Auto follow-up</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Inquiry messages always include a Booked button. After Booked, the
            booking sequence runs with a Purchase button. Purchase stops every
            remaining WhatsApp.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save sequence"}
        </Button>
      </div>
      <SequenceEditor
        title="Inquiry sequence · Booked button"
        steps={inquiry}
        onChange={setInquiry}
      />
      <SequenceEditor
        title="Booking sequence · Purchase button"
        steps={booking}
        onChange={setBooking}
      />
    </div>
  );
}

function SequenceEditor({
  title,
  steps,
  onChange,
}: {
  title: string;
  steps: SequenceStep[];
  onChange: (steps: SequenceStep[]) => void;
}) {
  const update = (id: string, patch: Partial<SequenceStep>) => {
    onChange(steps.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 md:grid-cols-[160px_1fr]"
          >
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                Step {index + 1}
              </p>
              <p className="font-medium">{step.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDelay(step.delayMinutes)}
              </p>
              <p className="mt-2 text-xs">
                Button: {step.button === "booked" ? "Booked" : "Purchase"}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>WhatsApp body</Label>
                <Textarea
                  rows={6}
                  value={step.body}
                  onChange={(event) => update(step.id, { body: event.target.value })}
                />
              </div>
              <div className="grid gap-1.5 sm:max-w-sm">
                <Label>BotSpace template ID</Label>
                <Input
                  value={step.templateId}
                  onChange={(event) =>
                    update(step.id, { templateId: event.target.value })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
