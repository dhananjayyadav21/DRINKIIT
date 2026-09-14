import twilio from 'twilio';
import { env } from '@/config/env';
import { PRODUCTS, unitPrice } from '@/config/products';
import { Order } from '@/types/order';

const twilioClient =
  env.whatsapp.provider === 'twilio' ? twilio(env.whatsapp.twilio.accountSid, env.whatsapp.twilio.authToken) : null;

function toWhatsAppAddress(waId: string): string {
  return waId.startsWith('whatsapp:') ? waId : `whatsapp:${waId}`;
}

async function sendViaMeta(to: string, body: string): Promise<void> {
  const url = `https://graph.facebook.com/${env.whatsapp.meta.apiVersion}/${env.whatsapp.meta.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsapp.meta.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Meta API error (${res.status}): ${errorBody}`);
  }
}

async function sendViaTwilio(to: string, body: string): Promise<void> {
  await twilioClient!.messages.create({
    from: env.whatsapp.twilio.fromNumber,
    to: toWhatsAppAddress(to),
    contentSid: env.whatsapp.twilio.contentSid,
    contentVariables: JSON.stringify({ 1: body }),
  });
}

async function sendText(to: string, body: string): Promise<void> {
  try {
    if (env.whatsapp.provider === 'meta') {
      await sendViaMeta(to, body);
    } else {
      await sendViaTwilio(to, body);
    }
  } catch (err) {
    console.error(`WhatsApp send error (to ${to}):`, err instanceof Error ? err.message : err);
  }
}

function formatMoney(amount: number): string {
  return Number(amount).toFixed(2).replace(/\.00$/, '');
}

export function sendWelcome(to: string, name?: string | null): Promise<void> {
  const greetingName = name ? ` ${name}` : '';
  return sendText(
    to,
    `👋 Welcome to *${env.business.name}*${greetingName}!\n` +
      'We deliver clean drinking water bottles straight to your door.\n\n' +
      'Type *CATALOG* anytime to see our prices, or place an order directly, e.g.\n' +
      '*ORDER 1L 12*\n*ORDER 500ML 24*'
  );
}

export function sendCatalog(to: string): Promise<void> {
  const oneLiter = PRODUCTS['1L'];
  const fiveHundred = PRODUCTS['500ML'];

  return sendText(
    to,
    `*${env.business.name} – Price List* 💧\n\n` +
      `🔹 ${oneLiter.label} Bottles\n` +
      `₹${oneLiter.boxPrice} per box (${oneLiter.piecesPerBox} pcs) — ₹${formatMoney(
        unitPrice('1L')
      )} per bottle\n\n` +
      `🔹 ${fiveHundred.label} Bottles\n` +
      `₹${fiveHundred.boxPrice} per box (${fiveHundred.piecesPerBox} pcs) — ₹${formatMoney(
        unitPrice('500ML')
      )} per bottle\n\n` +
      `🚚 Free delivery within ${env.business.freeDeliveryRadiusKm}km\n\n` +
      'To order, send:\n*ORDER 1L <quantity>*\nor\n*ORDER 500ML <quantity>*\n\n' +
      'Example: ORDER 1L 12'
  );
}

export function sendHelp(to: string): Promise<void> {
  return sendText(
    to,
    "Sorry, I didn't understand that. 🤔\n\n" +
      'Type *CATALOG* to see our prices, or place an order like:\n' +
      '*ORDER 1L 12*\n*ORDER 500ML 24*'
  );
}

function orderLine(order: Order): string {
  const product = PRODUCTS[order.product];
  return `💧 ${product.label} x ${order.quantity}\n💰 Amount: ₹${formatMoney(order.amount)}`;
}

export function sendOtp(to: string, otp: string, order: Order): Promise<void> {
  return sendText(
    to,
    'Your order summary:\n' +
      `${orderLine(order)}\n\n` +
      `Your verification code is: *${otp}*\n` +
      'It is valid for 5 minutes.\n\n' +
      'Reply with the 6-digit code to confirm your order, or type RESEND if it expires.'
  );
}

export function sendOtpExpired(to: string): Promise<void> {
  return sendText(to, '⏰ Your verification code has expired. Reply *RESEND* to get a new one.');
}

export function sendOtpIncorrect(to: string): Promise<void> {
  return sendText(
    to,
    "❌ That code doesn't match. Please check and try again, or type *RESEND* for a new code."
  );
}

export function sendNoPendingOrder(to: string): Promise<void> {
  return sendText(to, "You don't have a pending order right now. Type *CATALOG* to see our prices.");
}

export function sendPaymentChoice(to: string, order: Order): Promise<void> {
  return sendText(
    to,
    `✅ Order verified!\n${orderLine(order)}\n\n` +
      'How would you like to pay?\n' +
      'Reply *COD* for Cash on Delivery, or *PAY* to pay online.'
  );
}

export function sendCodConfirmation(to: string, order: Order): Promise<void> {
  return sendText(
    to,
    '🎉 Order Confirmed!\n\n' +
      `Order ID: ${order.id}\n` +
      `${orderLine(order)} (Pay on delivery)\n\n` +
      `🚚 Free delivery within ${env.business.freeDeliveryRadiusKm}km. Our team will contact you shortly.\n\n` +
      `Thank you for choosing ${env.business.name}! 💧`
  );
}

export function sendPaymentLinkError(to: string): Promise<void> {
  return sendText(
    to,
    "⚠️ We couldn't generate your payment link right now. Please reply *PAY* to try again, or *COD* to pay on delivery instead."
  );
}

export function sendPaymentLink(to: string, order: Order, link: string): Promise<void> {
  return sendText(
    to,
    '💳 Please complete your payment using the secure link below:\n' +
      `${link}\n\n` +
      `Order ID: ${order.id}\n` +
      `Amount: ₹${formatMoney(order.amount)}\n\n` +
      'This link is valid for 24 hours.'
  );
}

export function sendPaidConfirmation(to: string, order: Order): Promise<void> {
  return sendText(
    to,
    '✅ Payment received! Your order is confirmed.\n\n' +
      `Order ID: ${order.id}\n` +
      `${orderLine(order)}\n\n` +
      `🚚 Free delivery within ${env.business.freeDeliveryRadiusKm}km. Thank you for choosing ${env.business.name}! 💧`
  );
}
