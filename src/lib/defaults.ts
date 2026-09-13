import type { SequenceStep, Settings } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  apiKey:
    process.env.BOTSPACE_API_KEY ??
    "botspace_b40b8c2c-b3c4-4eb6-bf9f-8ce230b68cce",
  channelId:
    process.env.BOTSPACE_CHANNEL_ID ?? "69ba3b443c58de2b169911a3",
  channelPhone: process.env.BOTSPACE_CHANNEL_PHONE ?? "+917240516000",
  businessName: "Shubham Motors",
  city: "Jaipur",
  showroomAddress: "Shubham Motors, Hero Motocorp dealer, Jaipur",
  liveWhatsApp: true,
  createBotspaceContacts: true,
  inquiryTemplateId: "hero_inquiry_followup",
  bookingTemplateId: "hero_booking_confirm",
  purchaseTemplateId: "hero_purchase_thanks",
};

export const DEFAULT_INQUIRY_SEQUENCE: SequenceStep[] = [
  {
    id: "inq-0",
    name: "Welcome + Booked",
    delayMinutes: 0,
    templateId: "hero_inquiry_followup",
    button: "booked",
    enabled: true,
    body: `Namaste {{firstName}} ji,

Shubham Motors (Hero Motocorp dealer), Jaipur se baat ho rahi hai.

Aapki *{{model}}* enquiry mil gayi hai. Test ride, on-road quote, ya booking ke liye neeche *Booked* button dabaiye.

Showroom: {{address}}
Call / WhatsApp: {{dealerPhone}}

Team Shubham Motors`,
  },
  {
    id: "inq-1",
    name: "Same-day nudge",
    delayMinutes: 240,
    templateId: "hero_inquiry_followup",
    button: "booked",
    enabled: true,
    body: `{{firstName}} ji, {{model}} ke baare mein kuch aur jaanna hai?

Aaj showroom aa sakte hain to test ride ready hai. Booking confirm karne ke liye *Booked* button dabaiye.

Shubham Motors, Jaipur · {{dealerPhone}}`,
  },
  {
    id: "inq-2",
    name: "Day 1 test ride",
    delayMinutes: 1440,
    templateId: "hero_inquiry_followup",
    button: "booked",
    enabled: true,
    body: `{{firstName}} ji, Hero {{model}} par test ride book karwa lein.

Jaipur showroom par exchange, finance aur genuine Hero accessories available hain.

*Booked* button dabaiye — team aapko slot confirm kar degi.`,
  },
  {
    id: "inq-3",
    name: "Day 3 exchange / offer",
    delayMinutes: 2880,
    templateId: "hero_inquiry_followup",
    button: "booked",
    enabled: true,
    body: `{{firstName}} ji, {{model}} ki booking abhi confirm karenge to delivery planning start ho jayegi.

Purani bike exchange aur Hero finance options bhi dekh sakte hain.

*Booked* tap kijiye. Shubham Motors, Jaipur.`,
  },
  {
    id: "inq-4",
    name: "Day 5 EMI / finance",
    delayMinutes: 2880,
    templateId: "hero_inquiry_followup",
    button: "booked",
    enabled: true,
    body: `{{firstName}} ji, {{model}} easy EMI par bhi le sakte hain.

Documents aur on-road quote ke liye showroom aa jaaiye, ya *Booked* button se booking lock kar dijiye.

Shubham Motors · Hero Motocorp · Jaipur`,
  },
  {
    id: "inq-5",
    name: "Day 7 last follow-up",
    delayMinutes: 2880,
    templateId: "hero_inquiry_followup",
    button: "booked",
    enabled: true,
    body: `{{firstName}} ji, yeh {{model}} enquiry par last reminder hai.

Agar abhi bhi interest hai to *Booked* button dabaiye. Warna hum auto follow-up yahin rok denge.

Shubham Motors, Jaipur · {{dealerPhone}}`,
  },
];

export const DEFAULT_BOOKING_SEQUENCE: SequenceStep[] = [
  {
    id: "book-0",
    name: "Booking confirmed + Purchase",
    delayMinutes: 0,
    templateId: "hero_booking_confirm",
    button: "purchase",
    enabled: true,
    body: `Badhai ho {{firstName}} ji!

Aapki *{{model}}* booking Shubham Motors, Jaipur par note ho gayi hai. Hamari team delivery, finance aur documents ke liye jaldi contact karegi.

Payment complete hone par *Purchase* button dabaiye. Uske baad auto WhatsApp follow-up band ho jayega.

Showroom: {{address}}
{{dealerPhone}}`,
  },
  {
    id: "book-1",
    name: "Day 1 payment reminder",
    delayMinutes: 1440,
    templateId: "hero_booking_confirm",
    button: "purchase",
    enabled: true,
    body: `{{firstName}} ji, {{model}} ki booking pending purchase par hai.

Documents / down payment complete hon to *Purchase* button dabaiye. Purchase ke baad hum auto follow-up hata denge.

Shubham Motors, Jaipur`,
  },
  {
    id: "book-2",
    name: "Day 3 last booking nudge",
    delayMinutes: 2880,
    templateId: "hero_booking_confirm",
    button: "purchase",
    enabled: true,
    body: `{{firstName}} ji, {{model}} booking complete karne ka last reminder.

*Purchase* tap kijiye jab payment ho jaye. Uske baad aap auto follow-up se nikal jayenge.

Shubham Motors · Hero Motocorp dealer · Jaipur`,
  },
];

export const PURCHASE_THANKS_BODY = `{{firstName}} ji, Shubham Motors family mein aapka swagat hai.

Aapki *{{model}}* purchase confirm ho gayi hai. Auto WhatsApp follow-up ab band hai.

Service, accessories ya insurance ke liye {{dealerPhone}} par call kijiye.

Dhanyavaad,
Shubham Motors, Jaipur`;
