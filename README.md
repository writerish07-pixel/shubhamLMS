# Shubham Motors WhatsApp follow-up

Sales desk for **Shubham Motors**, Hero Motocorp dealer in Jaipur. Import enquiry leads, send automatic **Hindi** WhatsApp from the BotSpace channel `+91 72405 16000`, confirm bookings with a **बुकिंग** button, then stop follow-up when **खरीद** is clicked.

## What it does

1. Bulk-import leads (name, mobile, Hero model) from a CSV template.
2. Start an auto WhatsApp follow-up sequence for every new enquiry.
3. Staff reply to every customer from the **इनबॉक्स** in this app — no BotSpace chat window needed.
4. Each enquiry WhatsApp is in Hindi and asks the customer to tap **बुकिंग**.
5. **खरीद** marks the lead sold and takes them **out of auto follow-up**.

Install on an Android phone: open the live URL in **Chrome** → menu → **Add to Home screen** / **Install app**, or use the in-app **ऐप** page.

Staff can also press बुकिंग / खरीद on the lead row. Customer taps and `BOOKED` / `PURCHASE` / बुकिंग / खरीद replies land on `/api/webhooks/botspace` and show in Inbox.

Set follow-up **interval** (30 min / 4 hours / 1 day) and **send time** (IST, e.g. 11:00) on the Follow-up page. Each lead also has a next-WhatsApp time picker. Auto messages stay inside showroom hours (default 09:30–20:00 IST).

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:43147](http://localhost:43147). On a phone, open the same URL in Chrome and install from **ऐप**.

## Inbox (replies from this app)

Point the BotSpace incoming-message webhook at this app. Incoming WhatsApp appears under **इनबॉक्स**. Type a reply and it is sent as a WhatsApp session message from `+91 7240516000`. Unknown numbers are created as paused leads so staff can still answer.

## Bulk upload template

Download from the Import page, or use `public/shubham-motors-leads-template.csv`:

```csv
name,mobile,model
Rajesh Sharma,9876543210,Splendor Plus
Priya Verma,9123456789,Xtreme 160R
```

Accepted headers: `name` / `customer name`, `mobile` / `phone` / `whatsapp`, `model` / `model inquiry`.

## BotSpace

This app is wired to:

- API key: set `BOTSPACE_API_KEY`
- Channel ID: `69ba3b443c58de2b169911a3`
- WhatsApp: `+91 7240516000`

Create these Meta-approved **Hindi (hi)** templates in BotSpace (quick-reply buttons required for the in-chat buttons). Open **टेम्पलेट** in the desk and press **फॉलो-अप से सिंक करें**. BotSpace Public API cannot list the template library, so this desk ships the Hindi catalog and maps the IDs below.

**Why WhatsApp was failing:** enquiry messages were sent as **MARKETING** templates (Meta drops them with 131049), the API posted **4 variables** into templates that only have `{{1}}` name and `{{2}}` model (132000), then fell back to a session message **outside the 24-hour window** (131047). Auto follow-up now sends the Hindi **UTILITY** lead-follow-up template below, with two variables, and only uses session text if the customer has messaged in the last 24 hours.

| Template ID | Role | Category | Quick reply | Variables |
|---|---|---|---|---|
| `shubham_lead_followup_hi` | Lead follow-up (create this first) | **UTILITY** | बुकिंग | `{{1}}` name, `{{2}}` model |
| `shubham_enquiry_welcome_hi` | Enquiry welcome (optional) | UTILITY | बुकिंग | `{{1}}` name, `{{2}}` model |
| `shubham_booking_confirm_hi` | Booking confirmed | UTILITY | खरीद | `{{1}}` name, `{{2}}` model |
| `shubham_booking_payment_hi` | Payment reminder | UTILITY | खरीद | `{{1}}` name, `{{2}}` model |
| `shubham_booking_last_hi` | Last booking reminder | UTILITY | खरीद | `{{1}}` name, `{{2}}` model |
| `shubham_purchase_thanks_hi` | Purchase thank you | UTILITY | none | `{{1}}` name, `{{2}}` model |

Older marketing enquiry templates (`shubham_enquiry_nudge_hi`, `testride`, `offer`, `emi`, `last`) stay in the catalog for copy, but they are **not** in the auto sequence because WhatsApp will not reliably deliver them.

**Lead follow-up Meta body (paste in BotSpace, category Utility, language hi):**

```
नमस्ते {{1}} जी, शुभम मोटर्स जयपुर से आपकी {{2}} पूछताछ पर फॉलो-अप है। यह उसी रिक्वेस्ट का अपडेट है। जवाब दें या बुकिंग बटन दबाकर अपॉइंटमेंट कन्फर्म करें।
```

Until templates are approved, session text still works **inside** the 24-hour window, and `BOOKED` / `PURCHASE` / बुकिंग / खरीद replies are treated as button taps.

Point the BotSpace incoming-message webhook at:

```
https://YOUR-DOMAIN/api/webhooks/botspace
```

Turn **Send live WhatsApp** off in Settings if you want to preview copy without hitting the API.

Leads are stored in `data/store.json` locally. On Railway/Render, attach a disk and set `DATA_DIR` so imports survive restarts.

## Go live (Railway or Render)

This desk needs a process that stays up (auto follow-up) and a disk (leads). Use **Railway** or **Render**, not a serverless host.

Set these variables in the host dashboard:

| Name | Value |
|---|---|
| `BOTSPACE_API_KEY` | your BotSpace key |
| `BOTSPACE_CHANNEL_ID` | `69ba3b443c58de2b169911a3` |
| `BOTSPACE_CHANNEL_PHONE` | `+917240516000` |
| `DATA_DIR` | `/data` on Railway, `/var/data` on Render |

After deploy, point the BotSpace incoming-message webhook to:

```
https://YOUR-LIVE-URL/api/webhooks/botspace
```

### Railway (recommended)

From WSL, in the cloned `shubhamLMS` folder:

```bash
# Railway CLI
curl -fsSL https://railway.com/install.sh | sh

railway login
railway init
railway up
```

Then in the [Railway dashboard](https://railway.app/dashboard):

1. Open the service → **Variables** and add the table above. Set `DATA_DIR=/data`.
2. **Volumes** → add a volume, mount path `/data` (keeps imported leads).
3. **Settings** → generate a public domain (`*.up.railway.app`), or attach your own domain.
4. Open the URL, import a test lead, then paste that URL into BotSpace as the webhook.

### Render

1. In [Render](https://dashboard.render.com), **New → Blueprint** and connect this repo, or **New Web Service** and point it at the repo.
2. Build command: `npm ci && npm run build`
3. Start command: `npm run start`
4. Add the env vars from the table. Set `DATA_DIR=/var/data`.
5. **Disks** → add a 1 GB disk mounted at `/var/data`.
6. After the first deploy, copy the `onrender.com` URL into BotSpace as the webhook.

A `render.yaml` blueprint is in the repo if you prefer one-click service + disk.

Health check: `GET /api/health`.
