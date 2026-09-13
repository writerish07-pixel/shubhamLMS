"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadActions } from "@/components/lead-actions";
import { StatusBadge } from "@/components/status-badge";
import { formatWhen } from "@/lib/format";
import { displayPhone } from "@/lib/phones";
import type { Lead, MessageLog } from "@/lib/types";

export function LeadDetailView({ id }: { id: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/leads/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Lead not found");
        setLead(data.lead);
        setMessages(data.messages ?? []);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("leads-updated", onUpdate);
    return () => window.removeEventListener("leads-updated", onUpdate);
  }, [load]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{error}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" render={<Link href="/leads" />}>
            Back to leads
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!lead) {
    return <p className="text-muted-foreground">Loading lead…</p>;
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" render={<Link href="/leads" />}>
        ← All leads
      </Button>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl tracking-wide">{lead.name}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1 text-muted-foreground">
            {displayPhone(lead.phone)} · {lead.model} · {lead.stage}
          </p>
          {lead.status === "purchased" ? (
            <p className="mt-2 text-sm text-emerald-800">
              Purchase received. This number is out of auto follow-up.
            </p>
          ) : null}
        </div>
        <LeadActions lead={lead} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Meta label="Next WhatsApp" value={formatWhen(lead.nextFollowupAt)} />
        <Meta label="Booked at" value={formatWhen(lead.bookedAt)} />
        <Meta label="Purchased at" value={formatWhen(lead.purchasedAt)} />
      </div>

      {lead.lastError ? (
        <Card>
          <CardHeader>
            <CardTitle>Last WhatsApp error</CardTitle>
          </CardHeader>
          <CardContent className="text-destructive">{lead.lastError}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-muted-foreground">No messages on this lead yet.</p>
          ) : (
            <ol className="space-y-4">
              {messages.map((message) => (
                <li key={message.id} className="border-b border-border/70 pb-4 last:border-0">
                  <p className="text-xs text-muted-foreground">
                    {message.direction === "out" ? "Sent" : "Received"} · {message.status} ·{" "}
                    {formatWhen(message.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-lg font-medium">{value}</CardContent>
    </Card>
  );
}
