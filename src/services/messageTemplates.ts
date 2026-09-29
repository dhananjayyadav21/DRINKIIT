import { env } from '@/config/env';
import { PRODUCTS, boxTierTable } from '@/config/products';
import { Order } from '@/types/order';

const DIVIDER = '──────────────────';

function formatMoney(amount: number): string {
  return Number(amount).toFixed(2).replace(/\.00$/, '');
}

function joinSections(...sections: string[]): string {
  return sections.filter(Boolean).join('\n\n');
}

function heading(title: string): string {
  return `*${title.toUpperCase()}*`;
}

function orderSummary(order: Order, note?: string): string {
  const metaLines = [
    `🛒 *Order ID*: *${order.id}*`,
    `🧾 *Total*: *₹${formatMoney(order.amount)}*${note ? ` _(${note})_` : ''}`,
  ];
  if (order.razorpay.paymentId) {
    metaLines.push(`🔖 *Payment ID*: *${order.razorpay.paymentId}*`);
  }

  const itemBlocks = order.items.map((item) => {
    const product = PRODUCTS[item.product];
    const pieces = item.quantity * product.piecesPerBox;
    const boxLabel = `Box${item.quantity > 1 ? 'es' : ''}`;
    return [
      `🥤 *${product.label}* — ${item.quantity} ${boxLabel} (${pieces} pcs)`,
      `🏷️ ₹${formatMoney(item.amount)}`,
    ].join('\n');
  });

  return joinSections(metaLines.join('\n'), itemBlocks.join('\n'));
}

function freeDeliveryLine(): string {
  return `🚚 *Free delivery* within ${env.business.freeDeliveryRadiusKm}km`;
}

function contactLine(): string {
  return env.business.whatsappNumber ? `📞 *Need help?* Call us at *+${env.business.whatsappNumber}*` : '';
}

function footer(): string {
  return joinSections(DIVIDER, `Thank you for choosing *${env.business.name}*! 💧`);
}

function catalogEntry(code: '1L' | '500ML'): string {
  const product = PRODUCTS[code];
  const tierLines = boxTierTable(code)
    .map(
      (row) =>
        `*${row.boxes} Box${row.boxes > 1 ? 'es' : ''}* (${row.pieces} pcs) — *₹${formatMoney(row.price)}*`
    )
    .join('\n');

  return [`_${product.label} | ${product.piecesPerBox} pcs/Box 🥤_`, tierLines].join('\n');
}

export function welcomeMessage(name?: string | null): string {
  const greetingName = name ? `, ${name}` : '';
  return joinSections(
    `👋 *Welcome to ${env.business.name}${greetingName}!*`,
    "We deliver clean, purified drinking water bottles straight to your door — quick, reliable and hassle-free.",
    '_Take a look at our price list below to get started._'
  );
}

export function catalogMessage(): string {
  return joinSections(
    heading(`${env.business.name} – Price List 💧`),
    catalogEntry('1L'),
    catalogEntry('500ML'),
    freeDeliveryLine(),
    '👉 *Tap "View catalog" below* to browse our products and add them to your cart.'
  );
}

export function helpMessage(): string {
  return joinSections(
    "🤔 Sorry, I didn't quite get that.",
    'Just say *Hi* anytime to see our price list and start an order — it only takes a minute.'
  );
}

export function cartUnresolvedMessage(): string {
  return joinSections(
    heading("We Couldn't Process That Cart ⚠️"),
    "A couple of items in your cart didn't match anything in our current price list.",
    'Please try adding items from the catalog again, or say *Hi* to see the latest options.'
  );
}

export function noPendingOrderMessage(): string {
  return joinSections(
    "You don't have an order in progress right now.",
    'Say *Hi* to see our price list and place a new order.'
  );
}

export function resumeOrRestartMessage(order: Order): string {
  return joinSections(
    heading('You Have an Order in Progress ⏸️'),
    orderSummary(order),
    'Would you like to continue this order, or start a new one instead?'
  );
}

export function askAddressMessage(order: Order): string {
  return joinSections(
    heading('Order Received ✅'),
    orderSummary(order),
    '📍 *One last step —* please confirm your delivery address and contact number so we can get this order to you.'
  );
}

export function paymentChoiceMessage(order: Order): string {
  return joinSections(
    heading('Order Summary'),
    orderSummary(order),
    '💳 *How would you like to pay?* Choose an option below.'
  );
}

export function codConfirmationMessage(order: Order): string {
  return joinSections(
    heading('Order Confirmed 🎉'),
    orderSummary(order, 'Pay on delivery'),
    `${freeDeliveryLine()}\nOur delivery team will reach out shortly to confirm timing.`,
    contactLine(),
    footer()
  );
}

export function paymentLinkErrorMessage(): string {
  return joinSections(
    heading("We Hit a Snag ⚠️"),
    "We couldn't generate your payment link just now.",
    'Please try again in a moment — or contact us directly and we’ll help you complete the order right away.'
  );
}

export function paymentLinkMessage(order: Order): string {
  return joinSections(
    heading('Complete Your Payment 💳'),
    orderSummary(order),
    '👉 *Tap the button below* to pay securely online. This link stays valid for 24 hours.'
  );
}

export function paidConfirmationMessage(order: Order): string {
  return joinSections(
    heading('Payment Received ✅'),
    orderSummary(order, 'Paid'),
    `${freeDeliveryLine()}\nYour order is confirmed and will be on its way soon.`,
    contactLine(),
    footer()
  );
}

export function orderInProgressMessage(order: Order): string {
  return joinSections(
    heading('Order In Progress 🚚'),
    orderSummary(order),
    DIVIDER,
    "Your order is packed and on its way — we're getting it to you as soon as possible!",
    '🙋 *Have a question about your delivery?* Tap below to contact us directly.',
    footer()
  );
}

export function orderDeliveredMessage(order: Order): string {
  return joinSections(
    heading('Order Delivered ✅'),
    orderSummary(order),
    DIVIDER,
    '📦 Your order has been delivered — we hope you enjoy it!',
    `Thank you for choosing *${env.business.name}*. We'd love to serve you again soon! 💧🙏`
  );
}
