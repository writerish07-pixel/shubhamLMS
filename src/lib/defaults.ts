import { HINDI_TEMPLATES, toHindiStep } from "@/lib/hindi-templates";
import type { SequenceStep, Settings } from "@/lib/types";

export const STORE_VERSION = 2;

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
  inquiryTemplateId: "shubham_enquiry_welcome_hi",
  bookingTemplateId: "shubham_booking_confirm_hi",
  purchaseTemplateId: "shubham_purchase_thanks_hi",
  templateLanguage: "hi",
  followupWindowStart: "09:30",
  followupWindowEnd: "20:00",
};

export const DEFAULT_INQUIRY_SEQUENCE: SequenceStep[] = HINDI_TEMPLATES.filter(
  (row) => row.role === "inquiry",
).map(toHindiStep);

export const DEFAULT_BOOKING_SEQUENCE: SequenceStep[] = HINDI_TEMPLATES.filter(
  (row) => row.role === "booking",
).map(toHindiStep);

export const PURCHASE_THANKS_BODY =
  HINDI_TEMPLATES.find((row) => row.role === "purchase")?.sessionBody ?? "";
