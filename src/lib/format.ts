export function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDelay(minutes: number): string {
  if (minutes <= 0) return "Immediately";
  if (minutes < 60) return `${minutes} min later`;
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? "1 day later" : `${days} days later`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour later" : `${hours} hours later`;
  }
  return `${minutes} min later`;
}
