import { env } from '@/config/env';
import { PRODUCTS, unitPrice } from '@/config/products';
import { Order } from '@/types/order';

const DIVIDER = '──────────────';

function formatMoney(amount: number): string {
  return Number(amount).toFixed(2).replace(/\.00$/, '');
}

function joinSections(...sections: string[]): string {
  return sections.filter(Boolean).join('\n\n');
}

function heading(title: string): string {
  return `*${title}*\n${DIVIDER}`;
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
  return joinSections(
    heading(`Welcome to ${env.business.name}! 👋`),
    `Hi${greetingName}! We deliver clean drinking water bottles straight to your door.`,
    joinSections(
      '📋 *How to order:*',
      '• Type *CATALOG* to see our prices \n\n • Send *ORDER 1L 12* or *ORDER 500ML 24* to order directly'
    )
  );
}

export function catalogMessage(): string {
  return joinSections(
    heading(`${env.business.name} – Price List 💧`),
    catalogEntry('1L'),
    catalogEntry('500ML'),
    freeDeliveryLine(),
    joinSections(
      '📝 *To order, send:*',
      '*ORDER 1L <quantity>*\n*ORDER 500ML <quantity>*\n\n_Example: ORDER 1L 12_'
    )
  );
}

export function helpMessage(): string {
  return joinSections(
    "🤔 Sorry, I didn't understand that.",
    joinSections(
      '📋 *You can:*',
      '• Type *CATALOG* to see our prices\n\n• Send *ORDER 1L 12* or *ORDER 500ML 24* to order'
    )
  );
}

export function otpMessage(otp: string, order: Order): string {
  return joinSections(
    heading('Order Summary'),
    orderSummary(order),
    heading('Verification Required'),
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
    'Type *CATALOG* to see our prices.'
  );
}

export function paymentChoiceMessage(order: Order): string {
  return joinSections(
    heading('Order Verified ✅'),
    orderSummary(order),
    joinSections(
      '💳 *How would you like to pay?*',
      'Reply *COD* for Cash on Delivery, or *PAY* to pay online.'
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
    'Please reply *PAY* to try again, or *COD* to pay on delivery instead.'
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
