import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/lib/types";

const LABELS: Record<LeadStatus, string> = {
  following: "Auto follow-up",
  booked: "Booked",
  purchased: "Purchased",
  paused: "Paused",
  exhausted: "Sequence done",
  failed: "Send failed",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    following: "bg-sky-100 text-sky-900 border-sky-200",
    booked: "bg-amber-100 text-amber-950 border-amber-200",
    purchased: "bg-emerald-100 text-emerald-950 border-emerald-200",
    paused: "bg-stone-100 text-stone-700 border-stone-200",
    exhausted: "bg-violet-100 text-violet-950 border-violet-200",
    failed: "bg-red-100 text-red-900 border-red-200",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {LABELS[status]}
    </Badge>
  );
}
