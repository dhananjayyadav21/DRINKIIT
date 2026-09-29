import { env } from '@/config/env';
import { PRODUCTS, boxTierTable } from '@/config/products';
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
  const itemLines = order.items.map((item) => {
    const product = PRODUCTS[item.product];
    const pieces = item.quantity * product.piecesPerBox;
    const boxLabel = `Box${item.quantity > 1 ? 'es' : ''}`;
    return `💧 ${product.label} — ${item.quantity} ${boxLabel} (${pieces} pcs) — ₹${formatMoney(item.amount)}`;
  });

  const lines = [
    `🆔 Order ID: *${order.id}*`,
    ...itemLines,
    `💰 Total: ₹${formatMoney(order.amount)}${note ? ` _(${note})_` : ''}`,
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
  const tierLines = boxTierTable(code)
    .map((row) => `   ${row.boxes} Box${row.boxes > 1 ? 'es' : ''} (${row.pieces} pcs) — ₹${formatMoney(row.price)}`)
    .join('\n');

  return [`🔹 *${product.label} Bottles* — ${product.piecesPerBox} pcs/box`, tierLines].join('\n');
}

export function welcomeMessage(name?: string | null): string {
  const greetingName = name ? `, ${name}` : '';
  return `👋 Welcome to *${env.business.name}*${greetingName}!\nWe deliver clean drinking water bottles straight to your door.`;
}

export function catalogMessage(): string {
  return joinSections(
    heading(`${env.business.name} – Price List 💧`),
    catalogEntry('1L'),
    catalogEntry('500ML'),
    freeDeliveryLine(),
    '_Tap "View catalog" below to browse and order._'
  );
}

export function helpMessage(): string {
  return joinSections(
    "🤔 Sorry, I didn't understand that.",
    'Say *Hi* to see our price list and browse the catalog.'
  );
}

export function cartUnresolvedMessage(): string {
  return joinSections(
    heading("Couldn't Process Cart ⚠️"),
    "We couldn't match the items in your cart to our product list.",
    'Please try again, or message us directly to place your order.'
  );
}

export function noPendingOrderMessage(): string {
  return joinSections(
    "You don't have a pending order right now.",
    'Say *Hi* to see our price list and start a new order.'
  );
}

export function askAddressMessage(order: Order): string {
  return joinSections(
    heading('Order Summary'),
    orderSummary(order),
    '📍 *Please confirm your address and contact info* so we can get your order to you.'
  );
}

export function paymentChoiceMessage(order: Order): string {
  return joinSections(
    heading('Order Summary'),
    orderSummary(order),
    '💳 *How would you like to pay?*'
  );
}

export function codConfirmationMessage(order: Order): string {
  return joinSections(
    heading('Order Confirmed 🎉'),
    orderSummary(order, 'Pay on delivery'),
    `${freeDeliveryLine()}. Our team will contact you shortly.`,
    contactLine(),
    footer()
  );
}

export function paymentLinkErrorMessage(): string {
  return joinSections(
    heading('Payment Link Failed ⚠️'),
    "We couldn't generate your payment link right now.",
    'Please try again in a moment, or contact us and we’ll help you complete the order.'
  );
}

export function paymentLinkMessage(order: Order): string {
  return joinSections(
    heading('Complete Your Payment 💳'),
    orderSummary(order),
    '_Tap the button below to pay securely. This link is valid for 24 hours._'
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

export function orderInProgressMessage(order: Order): string {
  return joinSections(
    heading('Order In Progress 🚚'),
    orderSummary(order),
    DIVIDER,
    "Your order is packed and on its way — we're getting it delivered to you soon!",
    '🙋 *Need help or have a question?* Tap the button below to contact us anytime.',
    footer()
  );
}

export function orderDeliveredMessage(order: Order): string {
  return joinSections(
    heading('Order Delivered ✅'),
    orderSummary(order),
    DIVIDER,
    '📦 Your order has been delivered. We hope you enjoy it!',
    `Thank you for choosing *${env.business.name}* — we hope to serve you again soon! 💧🙏`
  );
}
