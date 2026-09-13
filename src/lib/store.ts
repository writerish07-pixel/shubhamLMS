import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_BOOKING_SEQUENCE,
  DEFAULT_INQUIRY_SEQUENCE,
  DEFAULT_SETTINGS,
  STORE_VERSION,
} from "@/lib/defaults";
import { applyHindiTemplateCatalog } from "@/lib/hindi-templates";
import type { Lead, MessageLog, SequenceStep, Settings, StoreData } from "@/lib/types";

function dataDir() {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    return process.env.RAILWAY_VOLUME_MOUNT_PATH;
  }
  if (process.env.RENDER) return "/var/data";
  if (process.env.VERCEL) return path.join("/tmp", "shubham-motors");
  return path.join(process.cwd(), "data");
}

function storePath() {
  return path.join(dataDir(), "store.json");
}

function emptyStore(): StoreData {
  return {
    storeVersion: STORE_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    inquirySequence: structuredClone(DEFAULT_INQUIRY_SEQUENCE),
    bookingSequence: structuredClone(DEFAULT_BOOKING_SEQUENCE),
    leads: [],
    messages: [],
  };
}

let cache: StoreData | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function loadFromDisk(): Promise<StoreData> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const base = emptyStore();
    const version = parsed.storeVersion ?? 1;
    const data: StoreData = {
      storeVersion: STORE_VERSION,
      settings: {
        ...base.settings,
        ...parsed.settings,
      },
      inquirySequence: parsed.inquirySequence?.length
        ? parsed.inquirySequence
        : base.inquirySequence,
      bookingSequence: parsed.bookingSequence?.length
        ? parsed.bookingSequence
        : base.bookingSequence,
      leads: (parsed.leads ?? []).map((lead) => ({
        ...lead,
        unreadCount: lead.unreadCount ?? 0,
        lastReadAt: lead.lastReadAt ?? null,
      })),
      messages: parsed.messages ?? [],
    };
    if (version < STORE_VERSION) {
      applyHindiTemplateCatalog(data);
    }
    return data;
  } catch {
    return emptyStore();
  }
}

async function persist(data: StoreData) {
  await mkdir(dataDir(), { recursive: true });
  const tmp = `${storePath()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await writeFile(storePath(), JSON.stringify(data, null, 2), "utf8");
}

export async function withStore<T>(
  fn: (store: StoreData) => T | Promise<T>,
): Promise<T> {
  const run = queue.then(async () => {
    if (!cache) cache = await loadFromDisk();
    const result = await fn(cache);
    await persist(cache);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function readStore(): Promise<StoreData> {
  return withStore((store) => structuredClone(store));
}

export function findLeadByPhone(store: StoreData, phone: string): Lead | undefined {
  const digits = phone.replace(/\D/g, "");
  return store.leads.find((lead) => lead.phone.replace(/\D/g, "").endsWith(digits.slice(-10)));
}

export function activeSequence(
  store: StoreData,
  stage: Lead["stage"],
): SequenceStep[] {
  return (stage === "booking" ? store.bookingSequence : store.inquirySequence).filter(
    (step) => step.enabled,
  );
}

export function appendMessage(
  store: StoreData,
  message: Omit<MessageLog, "id" | "createdAt"> & { id?: string; createdAt?: string },
): MessageLog {
  const record: MessageLog = {
    id: message.id ?? crypto.randomUUID(),
    createdAt: message.createdAt ?? new Date().toISOString(),
    ...message,
  };
  store.messages.unshift(record);
  if (store.messages.length > 5000) {
    store.messages.length = 5000;
  }
  return record;
}

export function touchLead(lead: Lead) {
  lead.updatedAt = new Date().toISOString();
}

export function getSettings(store: StoreData): Settings {
  return store.settings;
}
