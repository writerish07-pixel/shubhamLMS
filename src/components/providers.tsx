"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { FollowupPoller } from "@/components/followup-poller";
import { InstallBanner } from "@/components/install-banner";
import { PwaRegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      {children}
      <Toaster position="top-right" />
      <FollowupPoller />
      <PwaRegister />
      <InstallBanner />
    </ThemeProvider>
  );
}
