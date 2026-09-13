import type { ButtonKind, SequenceStep, StoreData } from "@/lib/types";

export type HindiTemplate = {
  templateId: string;
  name: string;
  nameHi: string;
  language: "hi";
  category: "MARKETING" | "UTILITY";
  role: "inquiry" | "booking" | "purchase" | "followup";
  button: ButtonKind | null;
  buttonLabel: string | null;
  sessionBody: string;
  metaBody: string;
  delayMinutes: number;
  stepId: string;
  variableCount: number;
  inDefaultSequence?: boolean;
};

export const LEAD_FOLLOWUP_TEMPLATE_ID = "shubham_lead_followup_hi";

const FOLLOWUP_NEXT_BODY = `नमस्ते {{firstName}} जी,

शुभम मोटर्स, जयपुर। आपकी *{{model}}* पूछताछ अभी खुली है। यह उसी रिक्वेस्ट का अगला फॉलो-अप है।

अगर जानकारी पूरी हो गई है तो इस चैट पर जवाब दें, नहीं तो अपॉइंटमेंट कन्फर्म करने के लिए *बुकिंग* बटन दबाएँ।

{{address}}
{{dealerPhone}}`;

const FOLLOWUP_LAST_BODY = `नमस्ते {{firstName}} जी,

शुभम मोटर्स, जयपुर से आपकी *{{model}}* पूछताछ पर अंतिम फॉलो-अप है।

रिक्वेस्ट जारी रखनी हो तो *बुकिंग* बटन दबाएँ या इस चैट पर जवाब दें। नहीं तो ऑटो फॉलो-अप यहीं रुक जाएगा।

टीम शुभम मोटर्स · {{dealerPhone}}`;

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
    templateId: "shubham_enquiry_welcome_hi",
    name: "Welcome",
    nameHi: "स्वागत + बुकिंग",
    language: "hi",
    category: "UTILITY",
    role: "inquiry",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 0,
    variableCount: 2,
    inDefaultSequence: false,
    sessionBody: `नमस्ते {{firstName}} जी,

शुभम मोटर्स (हीरो मोटोकॉर्प डीलर), जयपुर से बात हो रही है।

आपकी *{{model}}* की पूछताछ हमें मिल गई है। हम उसी रिक्वेस्ट पर काम कर रहे हैं। जवाब दें या *बुकिंग* बटन दबाएँ।

शोरूम: {{address}}
कॉल / व्हाट्सऐप: {{dealerPhone}}

टीम शुभम मोटर्स`,
    metaBody: `नमस्ते {{1}} जी, शुभम मोटर्स (हीरो मोटोकॉर्प डीलर) जयपुर। आपकी {{2}} की पूछताछ हमें मिल गई है। हम उसी रिक्वेस्ट पर काम कर रहे हैं। जवाब दें या बुकिंग बटन दबाएँ।`,
  },
  {
    stepId: "inq-followup",
    templateId: LEAD_FOLLOWUP_TEMPLATE_ID,
    name: "Lead follow-up",
    nameHi: "लीड फॉलो-अप",
    language: "hi",
    category: "UTILITY",
    role: "followup",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 0,
    variableCount: 2,
    inDefaultSequence: true,
    sessionBody: `नमस्ते {{firstName}} जी,

शुभम मोटर्स, जयपुर से आपकी *{{model}}* पूछताछ पर फॉलो-अप है।

यह उसी रिक्वेस्ट का अपडेट है जो आपने हमें दी थी। अगर और जानकारी चाहिए तो इस चैट पर जवाब दें, या अपॉइंटमेंट कन्फर्म करने के लिए *बुकिंग* बटन दबाएँ।

शोरूम: {{address}}
कॉल / व्हाट्सऐप: {{dealerPhone}}

टीम शुभम मोटर्स`,
    metaBody: `नमस्ते {{1}} जी, शुभम मोटर्स जयपुर से आपकी {{2}} पूछताछ पर फॉलो-अप है। यह उसी रिक्वेस्ट का अपडेट है। जवाब दें या बुकिंग बटन दबाकर अपॉइंटमेंट कन्फर्म करें।`,
  },
  {
    stepId: "inq-1",
    templateId: "shubham_enquiry_nudge_hi",
    name: "Same-day nudge",
    nameHi: "आज का रिमाइंडर",
    language: "hi",
    category: "MARKETING",
    role: "inquiry",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 240,
    variableCount: 2,
    inDefaultSequence: false,
    sessionBody: `{{firstName}} जी, {{model}} के बारे में और जानना है?

आज शोरूम आ सकते हैं तो टेस्ट राइड तैयार है। बुकिंग कन्फर्म करने के लिए *बुकिंग* बटन दबाएँ।

शुभम मोटर्स, जयपुर · {{dealerPhone}}`,
    metaBody: `{{1}} जी, {{2}} के बारे में और जानना है? आज शोरूम आएँ, टेस्ट राइड तैयार है। बुकिंग बटन दबाएँ। शुभम मोटर्स, जयपुर।`,
  },
  {
    stepId: "inq-2",
    templateId: "shubham_enquiry_testride_hi",
    name: "Test ride",
    nameHi: "टेस्ट राइड आमंत्रण",
    language: "hi",
    category: "MARKETING",
    role: "inquiry",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 1440,
    variableCount: 2,
    inDefaultSequence: false,
    sessionBody: `{{firstName}} जी, हीरो *{{model}}* पर टेस्ट राइड बुक करवा लें।

जयपुर शोरूम पर एक्सचेंज, फाइनेंस और असली हीरो एक्सेसरीज़ उपलब्ध हैं।

*बुकिंग* बटन दबाएँ — टीम स्लॉट कन्फर्म कर देगी।`,
    metaBody: `{{1}} जी, हीरो {{2}} पर टेस्ट राइड बुक करवा लें। जयपुर शोरूम पर एक्सचेंज और फाइनेंस उपलब्ध है। बुकिंग बटन दबाएँ।`,
  },
  {
    stepId: "inq-3",
    templateId: "shubham_enquiry_offer_hi",
    name: "Exchange offer",
    nameHi: "एक्सचेंज ऑफर",
    language: "hi",
    category: "MARKETING",
    role: "inquiry",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 2880,
    variableCount: 2,
    inDefaultSequence: false,
    sessionBody: `{{firstName}} जी, *{{model}}* की बुकिंग अभी कन्फर्म करेंगे तो डिलीवरी प्लानिंग शुरू हो जाएगी।

पुरानी बाइक एक्सचेंज और हीरो फाइनेंस विकल्प भी देख सकते हैं।

*बुकिंग* बटन दबाएँ। शुभम मोटर्स, जयपुर।`,
    metaBody: `{{1}} जी, {{2}} की बुकिंग अभी कन्फर्म करें तो डिलीवरी प्लानिंग शुरू हो जाएगी। पुरानी बाइक एक्सचेंज भी देख सकते हैं। बुकिंग बटन दबाएँ।`,
  },
  {
    stepId: "inq-4",
    templateId: "shubham_enquiry_emi_hi",
    name: "EMI / finance",
    nameHi: "ईएमआई / फाइनेंस",
    language: "hi",
    category: "MARKETING",
    role: "inquiry",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 2880,
    variableCount: 2,
    inDefaultSequence: false,
    sessionBody: `{{firstName}} जी, *{{model}}* आसान ईएमआई पर भी ले सकते हैं।

कागज़ात और ऑन-रोड कोट के लिए शोरूम आ जाएँ, या *बुकिंग* बटन से बुकिंग लॉक कर दीजिए।

शुभम मोटर्स · हीरो मोटोकॉर्प · जयपुर`,
    metaBody: `{{1}} जी, {{2}} आसान ईएमआई पर भी ले सकते हैं। कागज़ात के लिए शोरूम आएँ या बुकिंग बटन दबाएँ। शुभम मोटर्स, जयपुर।`,
  },
  {
    stepId: "inq-5",
    templateId: "shubham_enquiry_last_hi",
    name: "Last enquiry reminder",
    nameHi: "अंतिम पूछताछ रिमाइंडर",
    language: "hi",
    category: "MARKETING",
    role: "inquiry",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 2880,
    variableCount: 2,
    inDefaultSequence: false,
    sessionBody: `{{firstName}} जी, यह *{{model}}* पूछताछ पर अंतिम रिमाइंडर है।

अगर अभी भी रुचि है तो *बुकिंग* बटन दबाएँ। नहीं तो हम ऑटो फॉलो-अप यहीं रोक देंगे।

शुभम मोटर्स, जयपुर · {{dealerPhone}}`,
    metaBody: `{{1}} जी, यह {{2}} पूछताछ पर अंतिम रिमाइंडर है। रुचि हो तो बुकिंग बटन दबाएँ, नहीं तो ऑटो फॉलो-अप रुक जाएगा। शुभम मोटर्स, जयपुर।`,
  },
  {
    stepId: "book-0",
    templateId: "shubham_booking_confirm_hi",
    name: "Booking confirmed",
    nameHi: "बुकिंग कन्फर्म + खरीद",
    language: "hi",
    category: "UTILITY",
    role: "booking",
    button: "purchase",
    buttonLabel: "खरीद",
    delayMinutes: 0,
    variableCount: 2,
    inDefaultSequence: true,
    sessionBody: `बधाई हो {{firstName}} जी!

आपकी *{{model}}* बुकिंग शुभम मोटर्स, जयपुर पर नोट हो गई है। हमारी टीम डिलीवरी, फाइनेंस और कागज़ात के लिए जल्दी संपर्क करेगी।

पेमेंट पूरा होने पर *खरीद* बटन दबाएँ। उसके बाद ऑटो व्हाट्सऐप फॉलो-अप बंद हो जाएगा।

शोरूम: {{address}}
{{dealerPhone}}`,
    metaBody: `बधाई हो {{1}} जी! आपकी {{2}} बुकिंग शुभम मोटर्स जयपुर पर नोट हो गई है। पेमेंट पूरा होने पर खरीद बटन दबाएँ। उसके बाद ऑटो फॉलो-अप बंद हो जाएगा।`,
  },
  {
    stepId: "book-1",
    templateId: "shubham_booking_payment_hi",
    name: "Payment reminder",
    nameHi: "पेमेंट रिमाइंडर",
    language: "hi",
    category: "UTILITY",
    role: "booking",
    button: "purchase",
    buttonLabel: "खरीद",
    delayMinutes: 1440,
    variableCount: 2,
    inDefaultSequence: true,
    sessionBody: `{{firstName}} जी, *{{model}}* की बुकिंग पेमेंट के इंतज़ार में है।

कागज़ात / डाउन पेमेंट पूरा हो तो *खरीद* बटन दबाएँ। खरीद के बाद हम ऑटो फॉलो-अप हटा देंगे।

शुभम मोटर्स, जयपुर`,
    metaBody: `{{1}} जी, {{2}} की बुकिंग पेमेंट के इंतज़ार में है। पेमेंट पूरा हो तो खरीद बटन दबाएँ। शुभम मोटर्स, जयपुर।`,
  },
  {
    stepId: "book-2",
    templateId: "shubham_booking_last_hi",
    name: "Last booking reminder",
    nameHi: "अंतिम बुकिंग रिमाइंडर",
    language: "hi",
    category: "UTILITY",
    role: "booking",
    button: "purchase",
    buttonLabel: "खरीद",
    delayMinutes: 2880,
    variableCount: 2,
    inDefaultSequence: true,
    sessionBody: `{{firstName}} जी, *{{model}}* बुकिंग पूरी करने का अंतिम रिमाइंडर।

पेमेंट हो जाए तो *खरीद* बटन दबाएँ। उसके बाद आप ऑटो फॉलो-अप से निकल जाएँगे।

शुभम मोटर्स · हीरो मोटोकॉर्प डीलर · जयपुर`,
    metaBody: `{{1}} जी, {{2}} बुकिंग पूरी करने का अंतिम रिमाइंडर। पेमेंट हो तो खरीद बटन दबाएँ। शुभम मोटर्स, जयपुर।`,
  },
  {
    stepId: "purchase-0",
    templateId: "shubham_purchase_thanks_hi",
    name: "Purchase thank you",
    nameHi: "खरीद धन्यवाद",
    language: "hi",
    category: "UTILITY",
    role: "purchase",
    button: null,
    buttonLabel: null,
    delayMinutes: 0,
    variableCount: 2,
    inDefaultSequence: true,
    sessionBody: `{{firstName}} जी, शुभम मोटर्स परिवार में आपका स्वागत है।

आपकी *{{model}}* की खरीद कन्फर्म हो गई है। ऑटो व्हाट्सऐप फॉलो-अप अब बंद है।

सर्विस, एक्सेसरीज़ या इंश्योरेंस के लिए {{dealerPhone}} पर कॉल कीजिए।

धन्यवाद,
शुभम मोटर्स, जयपुर`,
    metaBody: `{{1}} जी, शुभम मोटर्स परिवार में आपका स्वागत है। आपकी {{2}} की खरीद कन्फर्म है। ऑटो फॉलो-अप अब बंद है। सर्विस के लिए कॉल करें। धन्यवाद, शुभम मोटर्स जयपुर।`,
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

export function defaultInquirySequence(): SequenceStep[] {
  const followup = HINDI_TEMPLATES.find((row) => row.templateId === LEAD_FOLLOWUP_TEMPLATE_ID);
  if (!followup) return [];
  const base = toHindiStep(followup);
  return [
    { ...base, id: "inq-0", name: "स्वागत / फॉलो-अप", delayMinutes: 0 },
    { ...base, id: "inq-1", name: "लीड फॉलो-अप", delayMinutes: 240 },
    { ...base, id: "inq-2", name: "अगला फॉलो-अप", delayMinutes: 1440, body: FOLLOWUP_NEXT_BODY },
    { ...base, id: "inq-3", name: "अंतिम फॉलो-अप", delayMinutes: 2880, body: FOLLOWUP_LAST_BODY },
  ];
}

export function applyHindiTemplateCatalog(store: StoreData) {
  const booking = HINDI_TEMPLATES.filter((row) => row.role === "booking");
  const purchase = HINDI_TEMPLATES.find((row) => row.role === "purchase");

  store.settings.inquiryTemplateId = LEAD_FOLLOWUP_TEMPLATE_ID;
  store.settings.bookingTemplateId = booking[0]?.templateId ?? store.settings.bookingTemplateId;
  store.settings.purchaseTemplateId = purchase?.templateId ?? store.settings.purchaseTemplateId;
  store.settings.templateLanguage = "hi";
  store.settings.showroomAddress = "शुभम मोटर्स, हीरो मोटोकॉर्प डीलर, जयपुर";
  store.inquirySequence = defaultInquirySequence();
  store.bookingSequence = booking.map(toHindiStep);
}
