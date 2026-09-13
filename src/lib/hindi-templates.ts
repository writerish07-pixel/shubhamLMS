import type { ButtonKind, SequenceStep, StoreData } from "@/lib/types";

export type HindiTemplate = {
  templateId: string;
  name: string;
  nameHi: string;
  language: "hi";
  category: "UTILITY";
  role: "inquiry" | "booking" | "purchase";
  button: ButtonKind | null;
  buttonLabel: string | null;
  sessionBody: string;
  metaBody: string;
  delayMinutes: number;
  stepId: string;
  variableCount: number;
};

export const LEAD_FOLLOWUP_TEMPLATE_ID = "shubham_lead_followup_hi";
export const BOOKING_TEMPLATE_ID = "shubham_booking_hi";
export const BOUGHT_TEMPLATE_ID = "shubham_bought_hi";

export function templateBodyVariables(
  templateId: string | undefined,
  name: string,
  model: string,
): string[] {
  const firstName = name.trim().split(/\s+/)[0] || name.trim();
  const row = HINDI_TEMPLATES.find((item) => item.templateId === templateId);
  const count = row?.variableCount ?? 2;
  return [firstName, model].slice(0, Math.max(0, count)).map((value) => String(value ?? ""));
}

export const HINDI_TEMPLATES: HindiTemplate[] = [
  {
    stepId: "inq-0",
    templateId: LEAD_FOLLOWUP_TEMPLATE_ID,
    name: "First follow-up",
    nameHi: "पहला फॉलो-अप",
    language: "hi",
    category: "UTILITY",
    role: "inquiry",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 0,
    variableCount: 2,
    sessionBody: `नमस्ते {{firstName}} जी,

शुभम मोटर्स, जयपुर से आपकी *{{model}}* पूछताछ पर फॉलो-अप है।

बुकिंग कन्फर्म करने के लिए *बुकिंग* बटन दबाएँ, या इस चैट पर जवाब दें।

शोरूम: {{address}}
कॉल / व्हाट्सऐप: {{dealerPhone}}

टीम शुभम मोटर्स`,
    metaBody: `नमस्ते {{1}} जी, शुभम मोटर्स जयपुर से आपकी {{2}} पूछताछ पर फॉलो-अप है। बुकिंग कन्फर्म करने के लिए बुकिंग बटन दबाएँ।`,
  },
  {
    stepId: "book-0",
    templateId: BOOKING_TEMPLATE_ID,
    name: "Booking",
    nameHi: "बुकिंग",
    language: "hi",
    category: "UTILITY",
    role: "booking",
    button: "purchase",
    buttonLabel: "खरीद",
    delayMinutes: 0,
    variableCount: 2,
    sessionBody: `नमस्ते {{firstName}} जी,

आपकी *{{model}}* बुकिंग शुभम मोटर्स, जयपुर पर कन्फर्म है।

डिलीवरी हो जाने पर *खरीद* बटन दबाएँ। उसके बाद ऑटो फॉलो-अप बंद हो जाएगा।

शोरूम: {{address}}
{{dealerPhone}}`,
    metaBody: `नमस्ते {{1}} जी, आपकी {{2}} बुकिंग शुभम मोटर्स जयपुर पर कन्फर्म है। डिलीवरी हो जाने पर खरीद बटन दबाएँ।`,
  },
  {
    stepId: "purchase-0",
    templateId: BOUGHT_TEMPLATE_ID,
    name: "Bought",
    nameHi: "खरीद",
    language: "hi",
    category: "UTILITY",
    role: "purchase",
    button: null,
    buttonLabel: null,
    delayMinutes: 0,
    variableCount: 2,
    sessionBody: `नमस्ते {{firstName}} जी,

आपकी *{{model}}* खरीद शुभम मोटर्स, जयपुर पर कन्फर्म है। डिलीवरी नोट हो गई है। ऑटो व्हाट्सऐप फॉलो-अप अब बंद है।

सर्विस के लिए {{dealerPhone}} पर कॉल कीजिए।

धन्यवाद,
टीम शुभम मोटर्स`,
    metaBody: `नमस्ते {{1}} जी, आपकी {{2}} खरीद शुभम मोटर्स जयपुर पर कन्फर्म है। डिलीवरी नोट हो गई है। ऑटो फॉलो-अप अब बंद है। धन्यवाद।`,
  },
];

export function toHindiStep(row: HindiTemplate): SequenceStep {
  return {
    id: row.stepId,
    name: row.nameHi,
    delayMinutes: row.delayMinutes,
    sendAtTime: null,
    templateId: row.templateId,
    button: row.button ?? "booked",
    enabled: true,
    body: row.sessionBody,
  };
}

export function templateByRole(role: HindiTemplate["role"]): HindiTemplate | undefined {
  return HINDI_TEMPLATES.find((row) => row.role === role);
}

export function defaultInquirySequence(): SequenceStep[] {
  const followup = templateByRole("inquiry");
  return followup ? [toHindiStep(followup)] : [];
}

export function defaultBookingSequence(): SequenceStep[] {
  const booking = templateByRole("booking");
  return booking ? [toHindiStep(booking)] : [];
}

export function applyHindiTemplateCatalog(store: StoreData) {
  const inquiry = templateByRole("inquiry");
  const booking = templateByRole("booking");
  const purchase = templateByRole("purchase");

  store.settings.inquiryTemplateId = inquiry?.templateId ?? LEAD_FOLLOWUP_TEMPLATE_ID;
  store.settings.bookingTemplateId = booking?.templateId ?? BOOKING_TEMPLATE_ID;
  store.settings.purchaseTemplateId = purchase?.templateId ?? BOUGHT_TEMPLATE_ID;
  store.settings.templateLanguage = "hi";
  store.settings.showroomAddress = "शुभम मोटर्स, हीरो मोटोकॉर्प डीलर, जयपुर";
  store.inquirySequence = defaultInquirySequence();
  store.bookingSequence = defaultBookingSequence();
}
