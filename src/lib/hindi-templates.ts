import type { ButtonKind, SequenceStep, StoreData } from "@/lib/types";

export type HindiTemplate = {
  templateId: string;
  name: string;
  nameHi: string;
  language: "hi";
  category: "MARKETING" | "UTILITY";
  role: "inquiry" | "booking" | "purchase";
  button: ButtonKind | null;
  buttonLabel: string | null;
  sessionBody: string;
  metaBody: string;
  delayMinutes: number;
  stepId: string;
};

export const HINDI_TEMPLATES: HindiTemplate[] = [
  {
    stepId: "inq-0",
    templateId: "shubham_enquiry_welcome_hi",
    name: "Welcome",
    nameHi: "स्वागत + बुकिंग",
    language: "hi",
    category: "MARKETING",
    role: "inquiry",
    button: "booked",
    buttonLabel: "बुकिंग",
    delayMinutes: 0,
    sessionBody: `नमस्ते {{firstName}} जी,

शुभम मोटर्स (हीरो मोटोकॉर्प डीलर), जयपुर से बात हो रही है।

आपकी *{{model}}* की पूछताछ हमें मिल गई है। टेस्ट राइड, ऑन-रोड कीमत या बुकिंग के लिए *बुकिंग* बटन दबाएँ।

शोरूम: {{address}}
कॉल / व्हाट्सऐप: {{dealerPhone}}

टीम शुभम मोटर्स`,
    metaBody: `नमस्ते {{1}} जी, शुभम मोटर्स (हीरो मोटोकॉर्प डीलर) जयपुर से बात हो रही है। आपकी {{2}} की पूछताछ मिल गई है। टेस्ट राइड या बुकिंग के लिए बुकिंग बटन दबाएँ।`,
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

export function applyHindiTemplateCatalog(store: StoreData) {
  const inquiry = HINDI_TEMPLATES.filter((row) => row.role === "inquiry");
  const booking = HINDI_TEMPLATES.filter((row) => row.role === "booking");
  const purchase = HINDI_TEMPLATES.find((row) => row.role === "purchase");

  store.settings.inquiryTemplateId = inquiry[0]?.templateId ?? store.settings.inquiryTemplateId;
  store.settings.bookingTemplateId = booking[0]?.templateId ?? store.settings.bookingTemplateId;
  store.settings.purchaseTemplateId = purchase?.templateId ?? store.settings.purchaseTemplateId;
  store.settings.templateLanguage = "hi";
  store.settings.showroomAddress = "शुभम मोटर्स, हीरो मोटोकॉर्प डीलर, जयपुर";
  store.inquirySequence = inquiry.map(toHindiStep);
  store.bookingSequence = booking.map(toHindiStep);
}
