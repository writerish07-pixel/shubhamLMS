"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDelay } from "@/lib/format";
import { splitDelay, toDelayMinutes, type DelayUnit } from "@/lib/schedule";
import type { SequenceStep } from "@/lib/types";

const INTERVAL_PRESETS = [
  { label: "अभी", minutes: 0 },
  { label: "30 मिनट", minutes: 30 },
  { label: "1 घंटा", minutes: 60 },
  { label: "4 घंटे", minutes: 240 },
  { label: "1 दिन", minutes: 1440 },
  { label: "2 दिन", minutes: 2880 },
];

const TIME_PRESETS = ["10:00", "11:00", "16:00", "18:00"];

export function SequenceView() {
  const [inquiry, setInquiry] = useState<SequenceStep[]>([]);
  const [booking, setBooking] = useState<SequenceStep[]>([]);
  const [windowStart, setWindowStart] = useState("09:30");
  const [windowEnd, setWindowEnd] = useState("20:00");
  const [applyWaiting, setApplyWaiting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/sequence")
      .then((response) => response.json())
      .then((data) => {
        setInquiry(data.inquirySequence ?? []);
        setBooking(data.bookingSequence ?? []);
        setWindowStart(data.followupWindowStart ?? "09:30");
        setWindowEnd(data.followupWindowEnd ?? "20:00");
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
          followupWindowStart: windowStart,
          followupWindowEnd: windowEnd,
          applyToWaitingLeads: applyWaiting,
        }),
      });
      if (!response.ok) throw new Error("Save failed");
      toast.success(
        applyWaiting
          ? "टाइमिंग सेव हो गई, waiting लीड्स रीशेड्यूल हुए"
          : "Follow-up time and interval saved",
      );
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
            हर मैसेज का गैप (interval) और भेजने का समय (IST) यहीं सेट करें। शोरूम
            घंटों के बाहर ऑटो व्हाट्सऐप नहीं जाएगा।
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save timing"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>भेजने का समय · जयपुर (IST)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="windowStart">शुरू</Label>
            <Input
              id="windowStart"
              type="time"
              value={windowStart}
              onChange={(event) => setWindowStart(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="windowEnd">खत्म</Label>
            <Input
              id="windowEnd"
              type="time"
              value={windowEnd}
              onChange={(event) => setWindowEnd(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={applyWaiting}
              onCheckedChange={(value) => setApplyWaiting(Boolean(value))}
            />
            Waiting लीड्स पर यह टाइमिंग अभी लागू करें
          </label>
        </CardContent>
      </Card>

      <SequenceEditor
        title="पूछताछ सीक्वेंस · बुकिंग बटन"
        steps={inquiry}
        onChange={setInquiry}
      />
      <SequenceEditor
        title="बुकिंग सीक्वेंस · खरीद बटन"
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
          <StepEditor
            key={step.id}
            index={index}
            step={step}
            onChange={(patch) => update(step.id, patch)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function StepEditor({
  index,
  step,
  onChange,
}: {
  index: number;
  step: SequenceStep;
  onChange: (patch: Partial<SequenceStep>) => void;
}) {
  const delay = splitDelay(step.delayMinutes);

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Step {index + 1} · {formatDelay(step.delayMinutes)}
            {step.sendAtTime ? ` · ${step.sendAtTime} IST` : ""}
          </p>
          <p className="font-medium">{step.name}</p>
          <p className="text-xs text-muted-foreground">
            बटन: {step.button === "booked" ? "बुकिंग" : "खरीद"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={step.enabled}
            onCheckedChange={(value) => onChange({ enabled: Boolean(value) })}
          />
          चालू
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>पिछले मैसेज के कितनी देर बाद (interval)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              value={delay.amount}
              onChange={(event) =>
                onChange({
                  delayMinutes: toDelayMinutes(Number(event.target.value), delay.unit),
                })
              }
            />
            <select
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              value={delay.unit}
              onChange={(event) =>
                onChange({
                  delayMinutes: toDelayMinutes(
                    delay.amount,
                    event.target.value as DelayUnit,
                  ),
                })
              }
            >
              <option value="minutes">मिनट</option>
              <option value="hours">घंटे</option>
              <option value="days">दिन</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INTERVAL_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="rounded-full bg-background px-2.5 py-1 text-xs hover:bg-accent"
                onClick={() => onChange({ delayMinutes: preset.minutes })}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>भेजने का समय (optional)</Label>
          <Input
            type="time"
            value={step.sendAtTime ?? ""}
            onChange={(event) =>
              onChange({ sendAtTime: event.target.value || null })
            }
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="rounded-full bg-background px-2.5 py-1 text-xs hover:bg-accent"
              onClick={() => onChange({ sendAtTime: null })}
            >
              कोई फिक्स टाइम नहीं
            </button>
            {TIME_PRESETS.map((time) => (
              <button
                key={time}
                type="button"
                className="rounded-full bg-background px-2.5 py-1 text-xs hover:bg-accent"
                onClick={() => onChange({ sendAtTime: time })}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>WhatsApp body</Label>
        <Textarea
          rows={5}
          value={step.body}
          onChange={(event) => onChange({ body: event.target.value })}
        />
      </div>
      <div className="grid gap-1.5 sm:max-w-sm">
        <Label>BotSpace template ID</Label>
        <Input
          value={step.templateId}
          onChange={(event) => onChange({ templateId: event.target.value })}
        />
      </div>
    </div>
  );
}
