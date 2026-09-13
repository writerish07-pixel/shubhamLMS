export type LeadStage = "inquiry" | "booking" | "sold";

export type LeadStatus =
  | "following"
  | "booked"
  | "purchased"
  | "paused"
  | "exhausted"
  | "failed";

export type ButtonKind = "booked" | "purchase";

export type SequenceStep = {
  id: string;
  name: string;
  delayMinutes: number;
  templateId: string;
  body: string;
  button: ButtonKind;
  enabled: boolean;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  model: string;
  status: LeadStatus;
  stage: LeadStage;
  autoFollowup: boolean;
  nextFollowupAt: string | null;
  nextStepIndex: number;
  lastOutboundAt: string | null;
  lastInboundAt: string | null;
  conversationId: string | null;
  contactId: string | null;
  bookedAt: string | null;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  source: "csv" | "manual" | "webhook";
  notes: string;
};

export type MessageLog = {
  id: string;
  leadId: string;
  direction: "out" | "in";
  channel: "whatsapp" | "system";
  kind: "template" | "session" | "button" | "system";
  body: string;
  templateId?: string;
  botspaceMessageId?: string;
  status: "queued" | "sent" | "simulated" | "failed" | "received";
  error?: string;
  createdAt: string;
};

export type Settings = {
  apiKey: string;
  channelId: string;
  channelPhone: string;
  businessName: string;
  city: string;
  showroomAddress: string;
  liveWhatsApp: boolean;
  createBotspaceContacts: boolean;
  inquiryTemplateId: string;
  bookingTemplateId: string;
  purchaseTemplateId: string;
};

export type StoreData = {
  settings: Settings;
  inquirySequence: SequenceStep[];
  bookingSequence: SequenceStep[];
  leads: Lead[];
  messages: MessageLog[];
};
