import {
  BOUGHT_TEMPLATE_ID,
  BOOKING_TEMPLATE_ID,
  defaultBookingSequence,
  defaultInquirySequence,
  LEAD_FOLLOWUP_TEMPLATE_ID,
  templateByRole,
} from "@/lib/hindi-templates";
import type { SequenceStep, Settings } from "@/lib/types";

export const STORE_VERSION = 4;

export const DEFAULT_SETTINGS: Settings = {
  apiKey:
    process.env.BOTSPACE_API_KEY ??
    "botspace_b40b8c2c-b3c4-4eb6-bf9f-8ce230b68cce",
  channelId:
    process.env.BOTSPACE_CHANNEL_ID ?? "69ba3b443c58de2b169911a3",
  channelPhone: process.env.BOTSPACE_CHANNEL_PHONE ?? "+917240516000",
  businessName: "Shubham Motors",
  city: "Jaipur",
  showroomAddress: "शुभम मोटर्स, हीरो मोटोकॉर्प डीलर, जयपुर",
  liveWhatsApp: true,
  createBotspaceContacts: true,
  inquiryTemplateId: LEAD_FOLLOWUP_TEMPLATE_ID,
  bookingTemplateId: BOOKING_TEMPLATE_ID,
  purchaseTemplateId: BOUGHT_TEMPLATE_ID,
  templateLanguage: "hi",
  followupWindowStart: "09:30",
  followupWindowEnd: "20:00",
};

export const DEFAULT_INQUIRY_SEQUENCE: SequenceStep[] = defaultInquirySequence();

export const DEFAULT_BOOKING_SEQUENCE: SequenceStep[] = defaultBookingSequence();

export const PURCHASE_THANKS_BODY = templateByRole("purchase")?.sessionBody ?? "";
