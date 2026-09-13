"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void> };

export function InstallBanner() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const installed =
      media.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(installed);
    const dismissed = window.localStorage.getItem("shubham-install-dismissed") === "1";
    setHidden(installed || dismissed);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
      if (!installed && !dismissed) setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || hidden || pathname.startsWith("/inbox")) return null;

  const dismiss = () => {
    window.localStorage.setItem("shubham-install-dismissed", "1");
    setHidden(true);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      setDeferred(null);
      setHidden(true);
      return;
    }
    window.location.href = "/install";
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[#16110f] p-3 text-[#f7f1e8] sm:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Download className="size-5 shrink-0 text-[#e2c9a2]" />
        <p className="min-w-0 flex-1 text-sm">
          Android पर होम स्क्रीन पर ऐप इंस्टॉल करें — इनबॉक्स फ़ोन से चलता है।
        </p>
        <Button size="sm" onClick={() => void install()}>
          इंस्टॉल
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          बाद में
        </Button>
      </div>
      <Link href="/install" className="sr-only">
        Install instructions
      </Link>
    </div>
  );
}
