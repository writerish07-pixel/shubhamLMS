"use client";

import { useEffect } from "react";

export function FollowupPoller() {
  useEffect(() => {
    const tick = () => {
      fetch("/api/followups/tick", { method: "POST" })
        .then((response) => response.json())
        .then((data: { sent?: number }) => {
          if (data.sent) {
            window.dispatchEvent(new Event("leads-updated"));
          }
        })
        .catch(() => undefined);
    };

    tick();
    const timer = window.setInterval(tick, 15000);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
