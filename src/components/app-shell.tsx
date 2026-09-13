"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bike,
  LayoutDashboard,
  MessageSquare,
  Settings2,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/sequence", label: "Follow-up", icon: MessageSquare },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
