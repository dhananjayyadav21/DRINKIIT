import { env } from '@/config/env';
import { PRODUCTS, unitPrice } from '@/config/products';
import { Order } from '@/types/order';

const DIVIDER = '────────────────────────────';

function formatMoney(amount: number): string {
  return Number(amount).toFixed(2).replace(/\.00$/, '');
}

function joinSections(...sections: string[]): string {
  return sections.filter(Boolean).join('\n\n');
}

function heading(title: string): string {
  return `*${title}*`;
}

function orderSummary(order: Order, note?: string): string {
  const product = PRODUCTS[order.product];
  const lines = [
    `🆔 Order ID: *${order.id}*`,
    `💧 Item: ${product.label} bottles`,
    `📦 Quantity: ${order.quantity}`,
    `💰 Amount: ₹${formatMoney(order.amount)}${note ? ` _(${note})_` : ''}`,
  ];
  if (order.razorpay.paymentId) {
    lines.push(`🧾 Payment ID: *${order.razorpay.paymentId}*`);
  }
  return lines.join('\n');
}

function freeDeliveryLine(): string {
  return `🚚 Free delivery within ${env.business.freeDeliveryRadiusKm}km`;
}

function contactLine(): string {
  return env.business.whatsappNumber ? `📞 Contact us: +${env.business.whatsappNumber}` : '';
}

function footer(): string {
  return joinSections(DIVIDER, `Thank you for choosing *${env.business.name}*! 💧`);
}

function catalogEntry(code: '1L' | '500ML'): string {
  const product = PRODUCTS[code];
  return [
    `🔹 *${product.label} Bottles*`,
    `   Box: ₹${product.boxPrice} (${product.piecesPerBox} pcs)`,
    `   Per bottle: ₹${formatMoney(unitPrice(code))}`,
  ].join('\n');
}

export function welcomeMessage(name?: string | null): string {
  const greetingName = name ? `, ${name}` : '';
  return `👋 Welcome to *${env.business.name}*${greetingName}!\nWe deliver clean drinking water bottles straight to your door.`;
}

export function menuMessage(): string {
  return joinSections(
    heading('What would you like to do?'),
    [
      `1️⃣ Order ${PRODUCTS['1L'].label} bottles`,
      `2️⃣ Order ${PRODUCTS['500ML'].label} bottles`,
      '3️⃣ View price list',
    ].join('\n'),
    '_Just reply with a number (1, 2 or 3)._'
  );
}

export function askQuantityMessage(code: '1L' | '500ML'): string {
  const product = PRODUCTS[code];
  return joinSections(
    heading(`💧 ${product.label} Bottles`),
    `₹${product.boxPrice} per box (${product.piecesPerBox} pcs) — ₹${formatMoney(unitPrice(code))} per bottle`,
    'How many bottles would you like? Reply with a number, e.g. *12*'
  );
}

export function catalogMessage(): string {
  return joinSections(
    heading(`${env.business.name} – Price List 💧`),
    catalogEntry('1L'),
    catalogEntry('500ML'),
    freeDeliveryLine(),
    '_Reply with 1 or 2 to order._'
  );
}

export function helpMessage(): string {
  return joinSections(
    "🤔 Sorry, I didn't understand that.",
    ['1️⃣ Order 1L', '2️⃣ Order 500ml', '3️⃣ View prices'].join('\n')
  );
}

export function otpMessage(otp: string, order: Order): string {
  return joinSections(
    heading('Order Summary'),
    orderSummary(order),
    `🔐 Your verification code is: *${otp}*\n⏱️ Valid for 5 minutes.`,
    'Reply with the 6-digit code to confirm your order, or type *RESEND* if it expires.'
  );
}

export function otpExpiredMessage(): string {
  return joinSections(
    heading('Code Expired ⏰'),
    'Your verification code has expired. Reply *RESEND* to get a new one.'
  );
}

export function otpIncorrectMessage(): string {
  return joinSections(
    heading('Incorrect Code ❌'),
    "That code doesn't match. Please check and try again, or type *RESEND* for a new code."
  );
}

export function noPendingOrderMessage(): string {
  return joinSections(
    "You don't have a pending order right now.",
    'Say *Hi* to see the menu and start a new order.'
  );
}

export function paymentChoiceMessage(order: Order): string {
  return joinSections(
    heading('Order Verified ✅'),
    orderSummary(order),
    joinSections(
      '💳 *How would you like to pay?*',
      '1️⃣ Cash on Delivery\n2️⃣ Pay Online',
      '_Reply with 1 or 2._'
    )
  );
}

export function codConfirmationMessage(order: Order): string {
  return joinSections(
    heading('Order Confirmed 🎉'),
    orderSummary(order, 'Pay on delivery'),
    `${freeDeliveryLine()}\nOur team will contact you shortly.`,
    contactLine(),
    footer()
  );
}

export function paymentLinkErrorMessage(): string {
  return joinSections(
    heading('Payment Link Failed ⚠️'),
    "We couldn't generate your payment link right now.",
    'Reply *1* for Cash on Delivery, or *2* to try the payment link again.'
  );
}

export function paymentLinkMessage(order: Order, link: string): string {
  return joinSections(
    heading('Complete Your Payment 💳'),
    orderSummary(order),
    `🔗 *Payment Link:*\n${link}`,
    '_This link is valid for 24 hours._'
  );
}

export function paidConfirmationMessage(order: Order): string {
  return joinSections(
    heading('Payment Received ✅'),
    orderSummary(order, 'Paid'),
    freeDeliveryLine(),
    contactLine(),
    footer()
  );
}
