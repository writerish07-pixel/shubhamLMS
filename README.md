# Shubham Motors WhatsApp follow-up

Sales desk for **Shubham Motors**, Hero Motocorp dealer in Jaipur. Import enquiry leads, send automatic WhatsApp from the BotSpace channel `+91 72405 16000`, confirm bookings with a **Booked** button, then stop follow-up when **Purchase** is clicked.

## What it does

1. Bulk-import leads (name, mobile, Hero model) from a CSV template.
2. Start an auto WhatsApp follow-up sequence for every new enquiry.
3. Each enquiry message asks the customer to tap **Booked**.
4. **Booked** sends a booking WhatsApp that includes a **Purchase** button.
5. **Purchase** marks the lead sold and takes them **out of auto follow-up**.

Staff can press the same Booked / Purchase buttons on the lead row. Customer taps and `BOOKED` / `PURCHASE` replies are picked up on `/api/webhooks/botspace`.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:43147](http://localhost:43147).

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

Create these Meta-approved templates in BotSpace (quick-reply buttons required for the in-chat buttons):

| Template ID | Button | Variables |
|---|---|---|
| `hero_inquiry_followup` | Booked | `{{1}}` name, `{{2}}` model |
| `hero_booking_confirm` | Purchase | `{{1}}` name, `{{2}}` model |
| `hero_purchase_thanks` | none | `{{1}}` name, `{{2}}` model |

Until templates are approved, the app still sends session text (works inside the 24-hour window) and treats `BOOKED` / `PURCHASE` replies as button taps.

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
