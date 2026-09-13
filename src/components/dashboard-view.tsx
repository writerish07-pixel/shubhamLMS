"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bike, CalendarCheck, MessageCircle, ShoppingBag, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatWhen } from "@/lib/format";
import { displayPhone } from "@/lib/phones";
import { downloadLeadTemplate } from "@/lib/download-template";
import type { Lead, MessageLog } from "@/lib/types";

type DashboardData = {
  stats: {
    total: number;
    following: number;
    booked: number;
    purchased: number;
    paused: number;
    failed: number;
    dueNow: number;
    liveWhatsApp: boolean;
    unread: number;
  };
  dueSoon: Lead[];
  recentLeads: Lead[];
  recentMessages: MessageLog[];
  settings: {
    businessName: string;
    city: string;
    channelPhone: string;
    liveWhatsApp: boolean;
  };
};

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/dashboard")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load dashboard");
        setData(await response.json());
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("leads-updated", onUpdate);
    const timer = window.setInterval(load, 20000);
    return () => {
      window.removeEventListener("leads-updated", onUpdate);
      window.clearInterval(timer);
    };
  }, [load]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard could not load</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={load}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Loading Shubham Motors desk…</p>;
  }

  const cards = [
    {
      label: "Auto follow-up",
      value: data.stats.following,
      hint: "Inquiry WhatsApp still running",
      icon: MessageCircle,
    },
    {
      label: "Booked",
      value: data.stats.booked,
      hint: "Waiting on Purchase button",
      icon: CalendarCheck,
    },
    {
      label: "Purchased",
      value: data.stats.purchased,
      hint: "Out of auto follow-up",
      icon: ShoppingBag,
    },
    {
      label: "Due now",
      value: data.stats.dueNow,
      hint: data.stats.liveWhatsApp ? "Live WhatsApp on" : "Simulation mode",
      icon: Bike,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-[#c8102e] uppercase">
            Jaipur sales desk
          </p>
          <h1 className="font-heading mt-1 text-3xl tracking-wide sm:text-4xl">
            Hero lead follow-up
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Import enquiry leads, reply to WhatsApp from this desk (no BotSpace
            inbox needed), and install the app on Android from{" "}
            <Link className="underline" href="/install">
              ऐप
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/inbox" />}>
            <MessageCircle className="size-4" />
            इनबॉक्स
            {data.stats.unread ? ` (${data.stats.unread})` : ""}
          </Button>
          <Button render={<Link href="/import" />}>
            <Upload className="size-4" />
            Import leads
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    {card.label}
                  </p>
                  <p className="mt-1 text-3xl font-semibold">{card.value}</p>
                </div>
                <span className="rounded-md bg-[#c8102e]/10 p-2 text-[#c8102e]">
                  <Icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent className="text-muted-foreground">{card.hint}</CardContent>
            </Card>
          );
        })}
      </div>

      {data.stats.total === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No leads on the floor yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Download the CSV template, add customer name, mobile number and
              the Hero model they asked for, then import. Auto WhatsApp starts
              on the first row.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button render={<Link href="/import" />}>Upload CSV</Button>
              <Button
                variant="outline"
                onClick={() => {
                  void downloadLeadTemplate();
                }}
              >
                Download template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next WhatsApp shots</CardTitle>
          </CardHeader>
          <CardContent>
            {data.dueSoon.length === 0 ? (
              <p className="text-muted-foreground">
                Nothing queued. Import leads or resume a paused follow-up.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.dueSoon.map((lead) => (
                  <li
                    key={lead.id}
                    className="flex items-start justify-between gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {lead.model} · {displayPhone(lead.phone)}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={lead.status} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatWhen(lead.nextFollowupAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentMessages.length === 0 ? (
              <p className="text-muted-foreground">
                Message log is empty until the first follow-up goes out.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.recentMessages.slice(0, 7).map((message) => (
                  <li key={message.id} className="border-b border-border/70 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs text-muted-foreground">
                      {message.direction === "out" ? "Sent" : "Received"} ·{" "}
                      {message.status} · {formatWhen(message.createdAt)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm">{message.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
