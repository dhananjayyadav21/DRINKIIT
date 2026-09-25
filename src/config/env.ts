const useMeta = process.env.WHATSAPP_META_CLOUD_API === 'true';
const useTwilio = process.env.WHATSAPP_TWILIO === 'true';

if (useMeta === useTwilio) {
  throw new Error(
    `Invalid WhatsApp provider configuration: WHATSAPP_META_CLOUD_API=${process.env.WHATSAPP_META_CLOUD_API} ` +
      `and WHATSAPP_TWILIO=${process.env.WHATSAPP_TWILIO}.\n` +
      'Set exactly ONE of them to "true" and the other to "false" in .env.local to choose a WhatsApp provider.'
  );
}

const required = [
  ...(useMeta
    ? ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN']
    : ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER', 'TWILIO_CONTENT_SID']),
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'MONGODB_URI',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}\n` +
      'Copy .env.example to .env.local and fill in the values before starting the server.'
  );
}

export const env = {
  whatsapp: {
    provider: (useMeta ? 'meta' : 'twilio') as 'meta' | 'twilio',

    meta: {
      token: process.env.WHATSAPP_TOKEN as string,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID as string,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN as string,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
    },

    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID as string,
      authToken: process.env.TWILIO_AUTH_TOKEN as string,
      // e.g. 'whatsapp:+14155238886' (Sandbox) or 'whatsapp:+91XXXXXXXXXX' (production number)
      fromNumber: process.env.TWILIO_WHATSAPP_NUMBER as string,
      // ContentSid (starts with "HX...") of a single-variable text Content Template -
      // Twilio requires all WhatsApp sends to reference a Content Template now.
      contentSid: process.env.TWILIO_CONTENT_SID as string,
      // Skip Twilio signature validation for local testing (ngrok URL mismatches, etc.)
      validateSignature: process.env.TWILIO_VALIDATE_SIGNATURE !== 'false',
    },
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID as string,
    keySecret: process.env.RAZORPAY_KEY_SECRET as string,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET as string,
  },

  mongodb: {
    uri: process.env.MONGODB_URI as string,
    dbName: process.env.MONGODB_DB_NAME || 'drinkit',
  },

  business: {
    name: process.env.BUSINESS_NAME || 'DRINK IT',
    freeDeliveryRadiusKm: Number(process.env.FREE_DELIVERY_RADIUS_KM || 5),
    // Customer-facing number for the "Chat on WhatsApp" links on the website, e.g. 919082814100
    whatsappNumber: process.env.BUSINESS_WHATSAPP_NUMBER || '',
    contactPhone: process.env.BUSINESS_CONTACT_PHONE || '',
    contactEmail: process.env.BUSINESS_CONTACT_EMAIL || '',
    address: process.env.BUSINESS_ADDRESS || '',
  },

  admin: {
    email: process.env.ADMIN_EMAIL as string,
    password: process.env.ADMIN_PASSWORD as string,
  },
};
