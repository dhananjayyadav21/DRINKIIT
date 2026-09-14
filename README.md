# DRINK IT — WhatsApp Ordering Bot (Next.js)

A backend for a WhatsApp ordering bot for a water bottle business, built with
**Next.js (App Router)**. Supports **two interchangeable WhatsApp providers**
— Meta's WhatsApp Cloud API or Twilio — switched with a single env flag, no
code changes needed. Customer and order data is stored as plain JSON files on
disk — no database to set up.

This is a Next.js port of the original Express version (`../express-server`);
the business logic (products, OTP verification, Razorpay payment) is
unchanged.

## How it works

1. First message from a customer → bot sends a **Welcome** message, then the
   **Catalog** (prices for 1L and 500ml boxes, free delivery within 5km).
2. Customer orders with `ORDER 1L 12` or `ORDER 500ML 24` (quantity = number
   of bottles). The bot calculates the price, generates a 6-digit OTP valid
   for 5 minutes, and texts it to the customer.
3. Customer replies with the OTP to verify. `RESEND` regenerates an expired
   code.
4. Once verified, the bot asks the customer to reply **COD** (Cash on
   Delivery) or **PAY** (pay online).
   - COD → order is marked `CONFIRMED` immediately, with a summary sent back.
   - PAY → a Razorpay payment link is generated and sent. A Razorpay
     webhook automatically marks the order `PAID` + `CONFIRMED` and notifies
     the customer once payment succeeds.
5. `CATALOG` can be sent at any time to see prices again.

All conversation progress is tracked per-customer
(`NEW → CATALOG_SENT → AWAITING_VERIFICATION → AWAITING_PAYMENT_CHOICE → AWAITING_PAYMENT`)
in `src/data/files/customers.json`, with orders in `src/data/files/orders.json`.

## Project structure

```
src/
  config/       env vars (dual WhatsApp provider switch), product/pricing config
  types/        Customer, Order TS types
  data/         JSON-file-backed storage and repositories
  services/     WhatsApp send layer (Meta + Twilio), Razorpay client, OTP helper, bot logic
  app/
    api/
      whatsapp/webhook/route.ts   GET (Meta verify) + POST (both providers)
      razorpay-webhook/route.ts   Razorpay payment webhook
      health/route.ts
    page.tsx, layout.tsx          minimal status page
```

## Prerequisites

- Node.js 18 or later
- **Either** a Twilio account (no Facebook/Meta account needed) **or** a Meta
  Developer account with a WhatsApp Business app — pick one via the
  `WHATSAPP_META_CLOUD_API` / `WHATSAPP_TWILIO` env flags
- A Razorpay account
- A public HTTPS URL for your server (ngrok for local dev, or Vercel/Railway/
  Render for deployment) — both providers and Razorpay need to reach your
  webhook over the internet

## 1. Install dependencies

```bash
cd drink-it
npm install
```

## 2. Configure environment

```bash
cp .env.example .env.local
```

Set **exactly one** of these to `true` (the other `false`) — the server
refuses to start if both are `true` or both are `false`:

```env
WHATSAPP_META_CLOUD_API=false
WHATSAPP_TWILIO=true
```

### Option A — Twilio (faster to start, no Facebook account)

1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio).
2. Console → **Messaging → Try it out → Send a WhatsApp message** to open the
   Sandbox. Join it from your phone with the `join <code>` message shown.
3. Copy **Account SID** / **Auth Token** (Console dashboard) and the sandbox
   number into `.env.local`.
4. Twilio requires all sends to reference a **Content Template**: Console →
   **Products & Services → Templates → Create new template** → type
   **Text**, body `{{1}}`, language English → **Save** (not "Save and
   submit" — no approval needed since messages are only sent within the 24h
   session window). Copy the resulting `HX...` SID into
   `TWILIO_CONTENT_SID`.
5. Note: some Twilio trial-account features (custom sandbox webhook,
   Content Templates) may prompt you to **upgrade** (add a small balance).
   This is just a Twilio billing step, unrelated to Meta/Facebook
   verification.

### Option B — Meta WhatsApp Cloud API

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
   → **Create App** → **Business** type.
2. Add the **WhatsApp** product → **API Setup** page gives you a temporary
   token + **Phone Number ID**.
3. For a permanent token: **Business Settings → Users → System Users** →
   create one → **Add Assets** (assign your WhatsApp app) → **Generate New
   Token** with `whatsapp_business_messaging` + `whatsapp_business_management`
   permissions, expiration **Never**.
4. Pick any random string for `WHATSAPP_VERIFY_TOKEN` (you'll re-enter it in
   the Meta dashboard webhook config).

## 3. Set up Razorpay

1. Sign up at [razorpay.com](https://razorpay.com) (test mode needs no KYC).
2. **Settings → API Keys** → generate a key pair → `RAZORPAY_KEY_ID` /
   `RAZORPAY_KEY_SECRET`.
3. `RAZORPAY_WEBHOOK_SECRET` is a string **you** choose — same value goes
   into the Razorpay webhook config in step 5.

## 4. Run it locally

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

Expose it with ngrok:

```bash
ngrok http 3000
```

## 5. Configure the webhooks

**WhatsApp (Twilio):** Console → Sandbox/Sender page → set **"When a message
comes in"** to:
```
https://<your-ngrok-or-deployed-url>/api/whatsapp/webhook
```
method `HTTP POST`.

**WhatsApp (Meta):** App Dashboard → **WhatsApp → Configuration** → Callback
URL:
```
https://<your-ngrok-or-deployed-url>/api/whatsapp/webhook
```
Verify Token = your `WHATSAPP_VERIFY_TOKEN`. Subscribe to the `messages`
field.

**Razorpay:** Dashboard → **Settings → Webhooks → Add New Webhook**:
```
https://<your-ngrok-or-deployed-url>/api/razorpay-webhook
```
Secret = your `RAZORPAY_WEBHOOK_SECRET`. Active event: `payment_link.paid`
only.

## 6. Switching providers later

Flip the two flags in `.env.local` and fill in the other provider's values —
no code changes, no webhook URL changes (both providers post to the same
`/api/whatsapp/webhook` path).

## Deploying

> **Persistent disk note:** JSON data files live at `src/data/files/*.json`
> on local disk. Serverless platforms (Vercel) have an ephemeral filesystem —
> a redeploy/cold start can wipe this data. For real production use, deploy
> somewhere with a persistent disk (Railway/Render with a volume) or swap the
> JSON store for a real database — treat the JSON files as a convenience log
> otherwise (the customer's WhatsApp thread already has every order and
> confirmation).

## Customizing prices

Prices, box sizes, and the free delivery radius live in
`src/config/products.ts` and `BUSINESS_NAME` / `FREE_DELIVERY_RADIUS_KM` in
`.env.local` — no other code changes needed.
