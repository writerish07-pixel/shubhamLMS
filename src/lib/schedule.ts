export const IST = "Asia/Kolkata";

export type DelayUnit = "minutes" | "hours" | "days";

export function parseClock(value: string | null | undefined): {
  hour: number;
  minute: number;
} | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function formatClock(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function istParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

export function fromIst(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  return new Date(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${formatClock(hour, minute)}:00+05:30`,
  );
}

export function toIstDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const parts = istParts(new Date(iso));
  if (Number.isNaN(parts.year)) return "";
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${formatClock(parts.hour, parts.minute)}`;
}

export function fromIstDatetimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(`${value}:00+05:30`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function splitDelay(minutes: number): { amount: number; unit: DelayUnit } {
  const value = Math.max(0, Math.round(minutes));
  if (value === 0) return { amount: 0, unit: "minutes" };
  if (value % 1440 === 0) return { amount: value / 1440, unit: "days" };
  if (value % 60 === 0) return { amount: value / 60, unit: "hours" };
  return { amount: value, unit: "minutes" };
}

export function toDelayMinutes(amount: number, unit: DelayUnit) {
  const safe = Math.max(0, Number.isFinite(amount) ? amount : 0);
  if (unit === "days") return Math.round(safe * 1440);
  if (unit === "hours") return Math.round(safe * 60);
  return Math.round(safe);
}

function addIstDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function setIstClock(date: Date, hour: number, minute: number) {
  const parts = istParts(date);
  return fromIst(parts.year, parts.month, parts.day, hour, minute);
}

export function applySendWindow(
  when: Date,
  windowStart: string,
  windowEnd: string,
) {
  const start = parseClock(windowStart) ?? { hour: 9, minute: 30 };
  const end = parseClock(windowEnd) ?? { hour: 20, minute: 0 };
  const parts = istParts(when);
  const minutes = parts.hour * 60 + parts.minute;
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (startMinutes === endMinutes) return when;

  if (minutes < startMinutes) {
    return fromIst(parts.year, parts.month, parts.day, start.hour, start.minute);
  }
  if (minutes >= endMinutes) {
    const next = addIstDays(
      fromIst(parts.year, parts.month, parts.day, start.hour, start.minute),
      1,
    );
    return next;
  }
  return when;
}

export function tomorrowIst(hour: number, minute: number) {
  const now = new Date();
  let when = setIstClock(now, hour, minute);
  if (when.getTime() <= now.getTime()) {
    when = addIstDays(when, 1);
  }
  return when;
}

export function computeFollowupAt(input: {
  from?: Date;
  delayMinutes: number;
  sendAtTime?: string | null;
  windowStart: string;
  windowEnd: string;
  respectWindow?: boolean;
}) {
  const from = input.from ?? new Date();
  let when = new Date(from.getTime() + Math.max(0, input.delayMinutes) * 60 * 1000);
  const clock = parseClock(input.sendAtTime);
  if (clock) {
    let atClock = setIstClock(when, clock.hour, clock.minute);
    if (atClock.getTime() < when.getTime()) {
      atClock = addIstDays(atClock, 1);
    }
    when = atClock;
  }
  if (input.respectWindow !== false) {
    when = applySendWindow(when, input.windowStart, input.windowEnd);
  }
  if (when.getTime() < Date.now() - 15_000) {
    when = new Date();
    if (clock) {
      let atClock = setIstClock(when, clock.hour, clock.minute);
      if (atClock.getTime() < Date.now()) atClock = addIstDays(atClock, 1);
      when = atClock;
    }
    if (input.respectWindow !== false) {
      when = applySendWindow(when, input.windowStart, input.windowEnd);
    }
  }
  return when;
}
