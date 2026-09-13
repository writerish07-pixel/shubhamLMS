"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWhen } from "@/lib/format";
import type { MessageLog } from "@/lib/types";

export function ActivityView() {
  const [messages, setMessages] = useState<MessageLog[]>([]);

  const load = useCallback(() => {
    fetch("/api/messages")
      .then((response) => response.json())
      .then((data: { messages: MessageLog[] }) => setMessages(data.messages ?? []));
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("leads-updated", onUpdate);
    return () => window.removeEventListener("leads-updated", onUpdate);
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl tracking-wide">Activity</h1>
        <p className="mt-1 text-muted-foreground">
          Every auto WhatsApp, Booked tap, and Purchase tap for Shubham Motors.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Message log</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-muted-foreground">
              No messages yet. Import leads to start the first follow-up.
            </p>
          ) : (
            <ol className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className="border-b border-border/70 pb-4 last:border-0 last:pb-0"
                >
                  <p className="text-xs text-muted-foreground">
                    {message.direction === "out" ? "Outbound" : "Inbound"} ·{" "}
                    {message.kind} · {message.status} · {formatWhen(message.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
                  {message.error ? (
                    <p className="mt-1 text-xs text-destructive">{message.error}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
