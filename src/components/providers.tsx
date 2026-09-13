"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { FollowupPoller } from "@/components/followup-poller";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      {children}
      <Toaster position="top-right" />
      <FollowupPoller />
    </ThemeProvider>
  );
}
