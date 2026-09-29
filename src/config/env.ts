const required = [
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
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
    meta: {
      token: process.env.WHATSAPP_TOKEN as string,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID as string,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN as string,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
      // Catalog ID from Meta Commerce Manager, linked to this WhatsApp Business Account.
      // Optional - when unset, the "View Catalog" option is hidden from the menu.
      catalogId: process.env.WHATSAPP_CATALOG_ID || '',
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
    // Optional - shown on invoices only when set (GSTIN, if registered).
    gstNumber: process.env.BUSINESS_GST_NUMBER || '',
  },

  admin: {
    email: process.env.ADMIN_EMAIL as string,
    password: process.env.ADMIN_PASSWORD as string,
  },
};
