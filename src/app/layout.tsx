import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "Shubham Motors · Hero WhatsApp follow-up",
  description:
    "Import Hero Motocorp leads for Shubham Motors, Jaipur and send automatic WhatsApp follow-up with Booked and Purchase buttons.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${bebas.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
