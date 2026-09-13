"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InstallEvent = Event & { prompt: () => Promise<void> };

export function InstallView() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    setStandalone(
      media.matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
  };

  return (
    <div className="space-y-5 px-4 py-6 sm:px-0">
      <div>
        <p className="text-sm font-medium tracking-[0.18em] text-[#c8102e] uppercase">
          Android app
        </p>
        <h1 className="font-heading mt-1 text-3xl tracking-wide">फ़ोन पर डाउनलोड</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          यह डेस्क Play Store APK नहीं है — Chrome में इंस्टॉल करने पर Android
          होम स्क्रीन पर असली ऐप जैसा आइकन लग जाता है। इनबॉक्स, लीड और व्हाट्सऐप
          जवाब ऑफ़लाइन शेल के साथ खुलते हैं।
        </p>
      </div>

      {standalone ? (
        <Card>
          <CardContent className="py-6 text-sm">
            ऐप पहले से होम स्क्रीन पर इंस्टॉल है। इनबॉक्स से जवाब भेजें।
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="size-5" />
              Chrome में इंस्टॉल
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {deferred ? (
              <Button onClick={() => void install()}>
                <Download className="size-4" />
                अभी इंस्टॉल करें
              </Button>
            ) : (
              <ol className="list-decimal space-y-2 pl-5">
                <li>Android फ़ोन पर Chrome से यह लिंक खोलें।</li>
                <li>दाएँ ऊपर मेनू (⋮) दबाएँ।</li>
                <li>
                  <strong>Add to Home screen</strong> / <strong>Install app</strong>{" "}
                  चुनें।
                </li>
                <li>नाम <strong>Shubham Motors</strong> रहने दें, Install दबाएँ।</li>
              </ol>
            )}
            <p className="text-muted-foreground">
              Safari/iPhone: Share → Add to Home Screen. जवाब के लिए BotSpace
              webhook इसी ऐप पर होना चाहिए।
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
