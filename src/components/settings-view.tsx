"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Settings } from "@/lib/types";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then((data) => setSettings(data.raw ?? data.settings))
      .catch(() => toast.error("Could not load settings"));
  }, []);

  if (!settings) {
    return <p className="text-muted-foreground">Loading BotSpace settings…</p>;
  }

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error("Save failed");
      toast.success("BotSpace settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: testPhone,
        name: "Test",
        model: "Splendor Plus",
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Test WhatsApp failed");
      return;
    }
    toast.success(data.simulated ? "Simulated (live WhatsApp is off)" : "Test WhatsApp sent");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">BotSpace</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Connected to Shubham Motors channel {settings.channelId}. हिंदी
            टेम्पलेट{" "}
            <a className="underline" href="/templates">
              टेम्पलेट
            </a>{" "}
            पेज पर हैं। BotSpace में भाषा Hindi चुनें, बटन बुकिंग / खरीद रखें।
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field
            label="API key"
            value={settings.apiKey}
            onChange={(apiKey) => setSettings({ ...settings, apiKey })}
          />
          <Field
            label="Channel ID"
            value={settings.channelId}
            onChange={(channelId) => setSettings({ ...settings, channelId })}
          />
          <Field
            label="WhatsApp number"
            value={settings.channelPhone}
            onChange={(channelPhone) => setSettings({ ...settings, channelPhone })}
          />
          <Field
            label="Showroom address"
            value={settings.showroomAddress}
            onChange={(showroomAddress) =>
              setSettings({ ...settings, showroomAddress })
            }
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={settings.liveWhatsApp}
              onCheckedChange={(value) =>
                setSettings({ ...settings, liveWhatsApp: Boolean(value) })
              }
            />
            Send live WhatsApp through BotSpace
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved template IDs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Field
            label="पूछताछ / बुकिंग"
            value={settings.inquiryTemplateId}
            onChange={(inquiryTemplateId) =>
              setSettings({ ...settings, inquiryTemplateId })
            }
          />
          <Field
            label="बुकिंग / खरीद"
            value={settings.bookingTemplateId}
            onChange={(bookingTemplateId) =>
              setSettings({ ...settings, bookingTemplateId })
            }
          />
          <Field
            label="खरीद धन्यवाद"
            value={settings.purchaseTemplateId}
            onChange={(purchaseTemplateId) =>
              setSettings({ ...settings, purchaseTemplateId })
            }
          />
          <p className="text-sm text-muted-foreground sm:col-span-3">
            Meta only delivers buttons on approved Hindi templates. IDs are on
            the{" "}
            <a className="underline" href="/templates">
              टेम्पलेट
            </a>{" "}
            page: inquiry <code>{settings.inquiryTemplateId}</code> (बुकिंग),
            booking <code>{settings.bookingTemplateId}</code> (खरीद), purchase{" "}
            <code>{settings.purchaseTemplateId}</code>. Variables: name then
            model. Until Meta approves them, session text still works and
            बुकिंग / खरीद / BOOKED / PURCHASE replies are accepted.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Point BotSpace incoming-message webhook here so customer chats and
            बुकिंग / खरीद taps land in this desk inbox. Staff replies from{" "}
            <a className="underline" href="/inbox">
              इनबॉक्स
            </a>
            , not from BotSpace.
          </p>
          <code className="block rounded-lg bg-muted px-3 py-2 text-foreground">
            /api/webhooks/botspace
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send a test WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="testPhone">Mobile number</Label>
            <Input
              id="testPhone"
              value={testPhone}
              placeholder="9876543210"
              onChange={(event) => setTestPhone(event.target.value)}
            />
          </div>
          <Button onClick={test} disabled={!testPhone}>
            Send test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
