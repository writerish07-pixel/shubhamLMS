"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bike,
  Download,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Settings2,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "इनबॉक्स", icon: Inbox },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/sequence", label: "Follow-up", icon: MessageSquare },
  { href: "/templates", label: "टेम्पलेट", icon: FileText },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/install", label: "ऐप", icon: Download },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inbox = pathname.startsWith("/inbox");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => {
      fetch("/api/inbox")
        .then((response) => response.json())
        .then((data: { unread?: number }) => setUnread(data.unread ?? 0))
        .catch(() => undefined);
    };
    load();
    const onUpdate = () => load();
    window.addEventListener("leads-updated", onUpdate);
    const timer = window.setInterval(load, 10000);
    return () => {
      window.removeEventListener("leads-updated", onUpdate);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="hero-rail" />
      <header className="sticky top-0 z-30 border-b border-border/80 bg-[#16110f] text-[#f7f1e8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-[#c8102e] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]">
              <Bike className="size-5" />
            </span>
            <span>
              <span className="font-heading block text-xl leading-none tracking-[0.14em]">
                SHUBHAM MOTORS
              </span>
              <span className="mt-1 block text-[11px] tracking-[0.22em] text-[#e2c9a2] uppercase">
                Hero Motocorp · Jaipur
              </span>
            </span>
          </Link>
          <div className="hidden text-right sm:block">
            <p className="text-xs tracking-wide text-[#e2c9a2] uppercase">
              WhatsApp desk
            </p>
            <p className="font-medium">+91 72405 16000</p>
          </div>
        </div>
        <nav className="border-t border-white/10 bg-[#1d1714]">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-2 sm:px-4">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-[#c8102e] text-white"
                      : "text-[#f3e8d8]/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                  {item.href === "/inbox" && unread > 0 ? (
                    <span className="rounded-full bg-white px-1.5 text-[10px] font-semibold text-[#c8102e]">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main
        className={cn(
          "mx-auto w-full max-w-7xl",
          inbox ? "px-0 py-0 sm:px-4 sm:py-4" : "px-4 py-6 sm:px-6 sm:py-8",
        )}
      >
        {children}
      </main>
    </div>
  );
}
