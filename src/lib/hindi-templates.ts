import { festiveOfferLine } from "@/lib/festive-offer";
import type { ButtonKind, SequenceStep, StoreData } from "@/lib/types";

export type HindiTemplateRole = "inquiry" | "booking" | "purchase" | "festive";

export type HindiTemplate = {
  templateId: string;
  name: string;
  nameHi: string;
  language: "hi";
  category: "UTILITY" | "MARKETING";
  role: HindiTemplateRole;
  button: ButtonKind | null;
  buttonLabel: string | null;
  sessionBody: string;
  metaBody: string;
  delayMinutes: number;
  stepId: string;
  variableCount: number;
};

export const LEAD_FOLLOWUP_TEMPLATE_ID = "shubham_lead_followup";
export const BOOKING_TEMPLATE_ID = "shubham_booking_hi";
export const BOUGHT_TEMPLATE_ID = "shubham_bought_hi";
export const UTILITY_FESTIVE_TEMPLATE_ID = "shubham_festive_offer";
export const HERO_FESTIVE_OFFER_TEMPLATE_ID = "herofestiveoffer";
export const FESTIVE_TEMPLATE_ID = HERO_FESTIVE_OFFER_TEMPLATE_ID;

const HERO_FESTIVE_BODY = `🎉 *Hero Festive Offers – Shubh Shuruaat!*

इस Festive Season घर लाएं अपनी पसंद की नई Hero बाइक या स्कूटर! 🏍️

💰 Hero Cash Bonus / Exchange Bonus
💳 HDFC Credit Card पर 5% Instant Cashback, अधिकतम ₹5,000 तक
🛍️ *Flipkart पर भी उपलब्ध हैं शानदार Offers!*

अपनी पसंद का मॉडल बताएं और जानें आपके लिए कौन-सा ऑफर सबसे फायदेमंद है।

*Shubham Motors, Jaipur*`;

export function isFestiveTemplate(templateId: string | undefined): boolean {
  if (!templateId) return false;
  if (
    templateId === FESTIVE_TEMPLATE_ID ||
    templateId === HERO_FESTIVE_OFFER_TEMPLATE_ID ||
    templateId === UTILITY_FESTIVE_TEMPLATE_ID
  ) {
    return true;
  }
  return HINDI_TEMPLATES.some(
    (item) => item.role === "festive" && item.templateId === templateId,
  );
}

export function templateBodyVariables(
  templateId: string | undefined,
  name: string,
  model: string,
): string[] {
  const firstName = name.trim().split(/\s+/)[0] || name.trim();
  const row = HINDI_TEMPLATES.find((item) => item.templateId === templateId);
  const count =
    row?.variableCount ??
    (isFestiveTemplate(templateId) && templateId !== HERO_FESTIVE_OFFER_TEMPLATE_ID
      ? 3
      : 2);
  if (count <= 0) return [];
  if (count >= 3) return [firstName, model, festiveOfferLine(model)];
  return [firstName, model].slice(0, count).map((value) => String(value ?? ""));
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
  {
    stepId: "festive-mkt-0",
    templateId: HERO_FESTIVE_OFFER_TEMPLATE_ID,
    name: "Hero festive offer",
    nameHi: "फेस्टिव ऑफर (herofestiveoffer)",
    language: "hi",
    category: "MARKETING",
    role: "festive",
    button: null,
    buttonLabel: "Call",
    delayMinutes: 0,
    variableCount: 0,
    sessionBody: HERO_FESTIVE_BODY,
    metaBody: HERO_FESTIVE_BODY,
  },
  {
    stepId: "festive-0",
    templateId: UTILITY_FESTIVE_TEMPLATE_ID,
    name: "Festive offer",
    nameHi: "फेस्टिव ऑफर (UTILITY)",
    language: "hi",
    category: "UTILITY",
    role: "festive",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 0,
    variableCount: 3,
    sessionBody: `नमस्ते {{firstName}} जी,

शुभम मोटर्स, जयपुर से *Hero Festive 2026* ऑफर है। आपकी *{{model}}* पर *{{cashBonus}}*।

ऑफर 8 से 20 अक्टूबर 2026 तक। बुकिंग कन्फर्म करने के लिए *बुकिंग* बटन दबाएँ, या इस चैट पर जवाब दें।

शोरूम: {{address}}
कॉल / व्हाट्सऐप: {{dealerPhone}}

टीम शुभम मोटर्स`,
    metaBody: `नमस्ते {{1}} जी, शुभम मोटर्स जयपुर से Hero Festive 2026 ऑफर है। आपकी {{2}} पर {{3}}। ऑफर 8 से 20 अक्टूबर 2026 तक। बुकिंग कन्फर्म करने के लिए बुकिंग बटन दबाएँ।`,
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

export function templateById(templateId: string | undefined): HindiTemplate | undefined {
  if (!templateId) return undefined;
  return HINDI_TEMPLATES.find((row) => row.templateId === templateId);
}

export function sendableTemplates(): HindiTemplate[] {
  return HINDI_TEMPLATES;
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
  store.settings.festiveTemplateId = HERO_FESTIVE_OFFER_TEMPLATE_ID;
  store.settings.templateLanguage = "hi";
  store.settings.showroomAddress = "शुभम मोटर्स, हीरो मोटोकॉर्प डीलर, जयपुर";
  store.inquirySequence = defaultInquirySequence();
  store.bookingSequence = defaultBookingSequence();
}
