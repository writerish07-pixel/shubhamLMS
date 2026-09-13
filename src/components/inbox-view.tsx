"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { LeadActions } from "@/components/lead-actions";
import { ReplyComposer } from "@/components/reply-composer";
import { StatusBadge } from "@/components/status-badge";
import { formatWhen } from "@/lib/format";
import { displayPhone } from "@/lib/phones";
import { cn } from "@/lib/utils";
import type { Lead, MessageLog } from "@/lib/types";

type Thread = {
  lead: Lead;
  lastMessage: MessageLog | null;
};

export function InboxView({ leadId }: { leadId?: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(() => {
    fetch("/api/inbox")
      .then((response) => response.json())
      .then((data: { threads: Thread[] }) => setThreads(data.threads ?? []))
      .finally(() => setLoading(false));
  }, []);

  const loadChat = useCallback(() => {
    if (!leadId) {
      setLead(null);
      setMessages([]);
      return;
    }
    fetch(`/api/leads/${leadId}`)
      .then((response) => response.json())
      .then((data: { lead: Lead; messages: MessageLog[] }) => {
        setLead(data.lead);
        setMessages([...(data.messages ?? [])].reverse());
      });
    fetch(`/api/leads/${leadId}/read`, { method: "POST" }).catch(() => undefined);
  }, [leadId]);

  useEffect(() => {
    loadList();
    loadChat();
    const onUpdate = () => {
      loadList();
      loadChat();
    };
    window.addEventListener("leads-updated", onUpdate);
    const timer = window.setInterval(onUpdate, 5000);
    return () => {
      window.removeEventListener("leads-updated", onUpdate);
      window.clearInterval(timer);
    };
  }, [loadChat, loadList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, leadId]);

  const selected = useMemo(
    () => threads.find((thread) => thread.lead.id === leadId)?.lead ?? lead,
    [lead, leadId, threads],
  );

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[32rem] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <aside
        className={cn(
          "w-full flex-col border-r border-border lg:flex lg:w-96",
          leadId ? "hidden" : "flex",
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <h1 className="font-heading text-2xl tracking-wide">इनबॉक्स</h1>
          <p className="text-xs text-muted-foreground">
            सारे व्हाट्सऐप जवाब यहीं से भेजें। BotSpace खोलने की ज़रूरत नहीं।
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">चैट लोड हो रही हैं…</p>
          ) : threads.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              अभी कोई चैट नहीं। लीड इम्पोर्ट करें, या ग्राहक +91 72405 16000
              पर मैसेज करे — वह यहीं दिखेगा।
            </div>
          ) : (
            <ul>
              {threads.map((thread) => {
                const active = thread.lead.id === leadId;
                return (
                  <li key={thread.lead.id}>
                    <Link
                      href={`/inbox/${thread.lead.id}`}
                      className={cn(
                        "flex items-start gap-3 border-b border-border/60 px-4 py-3",
                        active ? "bg-accent" : "hover:bg-muted/60",
                      )}
                    >
                      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#c8102e] text-sm font-medium text-white">
                        {thread.lead.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{thread.lead.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatWhen(thread.lastMessage?.createdAt ?? thread.lead.updatedAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {thread.lastMessage?.body || displayPhone(thread.lead.phone)}
                        </span>
                      </span>
                      {thread.lead.unreadCount > 0 ? (
                        <span className="mt-1 rounded-full bg-[#c8102e] px-1.5 text-[11px] text-white">
                          {thread.lead.unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section
        className={cn(
          "min-w-0 flex-1 flex-col bg-[#efe7da]",
          leadId ? "flex" : "hidden lg:flex",
        )}
      >
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
            <MessageCircle className="size-10 opacity-40" />
            <p>चैट चुनें। जवाब इसी ऐप से व्हाट्सऐप पर जाएगा।</p>
          </div>
        ) : (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-border bg-[#16110f] px-3 py-2 text-[#f7f1e8]">
              <div className="min-w-0">
                <Link href="/inbox" className="text-xs text-[#e2c9a2] lg:hidden">
                  ← इनबॉक्स
                </Link>
                <p className="truncate font-medium">{selected.name}</p>
                <p className="truncate text-xs text-[#e2c9a2]">
                  {displayPhone(selected.phone)} · {selected.model}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge status={selected.status} />
                <LeadActions lead={selected} compact />
              </div>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  अभी इस नंबर पर कोई मैसेज नहीं। नीचे से पहला जवाब भेजें।
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      message.direction === "out"
                        ? "ml-auto bg-[#d9fdd3] text-[#1c1412]"
                        : "bg-white text-[#1c1412]",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {message.direction === "out" ? "आप" : "ग्राहक"} ·{" "}
                      {formatWhen(message.createdAt)}
                      {message.status === "failed" ? " · failed" : ""}
                      {message.status === "simulated" ? " · local" : ""}
                    </p>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <ReplyComposer leadId={selected.id} />
          </>
        )}
      </section>
    </div>
  );
}
