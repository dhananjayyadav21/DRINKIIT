import * as customerRepo from '@/data/customerRepository';
import * as orderRepo from '@/data/orderRepository';
import { ProductCode, calculateAmount, mergeItemQuantities } from '@/config/products';
import { resolveProductCode } from '@/config/catalogMapping';
import * as whatsapp from './whatsappService';
import * as razorpayService from './razorpayService';
import { Customer } from '@/types/customer';
import { OrderStatus } from '@/types/order';

const GREETING_RE = /^h+[iey]{1,4}$|^hello+$|^menu$|^start$/i;

// States where the customer has an order mid-checkout (address or payment
// step) and hasn't finished it yet.
const PENDING_CHECKOUT_STATES: Customer['state'][] = [
  'AWAITING_ADDRESS',
  'AWAITING_PAYMENT_CHOICE',
  'AWAITING_PAYMENT',
];

// How long we keep treating a stray message (e.g. "Hi") as just a nudge that
// re-sends the current step's prompt, rather than genuine evidence the
// customer wandered off and needs to be asked whether to continue or start
// over. `customer.updatedAt` is bumped every time we last prompted them, so
// it doubles as "when did we last hear from/prompt this customer".
const FOLLOW_UP_WINDOW_MS = 10 * 60 * 1000;

function isWithinFollowUpWindow(customer: Customer): boolean {
  const elapsed = Date.now() - new Date(customer.updatedAt).getTime();
  return elapsed < FOLLOW_UP_WINDOW_MS;
}

export interface CartItem {
  retailerId: string;
  quantity: number;
  itemPrice: number;
}

export interface IncomingMessage {
  waId: string;
  name?: string | null;
  text?: string;
  cartItems?: CartItem[];
}

async function findOrCreateCustomer(waId: string, name?: string | null): Promise<Customer> {
  const existing = await customerRepo.findByWaId(waId);
  if (existing) return existing;
  return customerRepo.create({ waId, name });
}

// Messages from the SAME waId arriving close together (WhatsApp retries, a
// double-tap, etc.) are chained per-waId so they're always processed one at
// a time against a fresh read of that customer's state - otherwise two
// concurrent handlers could both read the old state and one update would
// clobber the other. Different waIds run fully in parallel via separate
// queue entries. This only covers requests landing on the same warm
// serverless instance, but that's the common case for near-simultaneous
// webhook deliveries and costs nothing for the normal one-message-at-a-time
// case.
const perUserQueues = new Map<string, Promise<void>>();

export function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  const previous = perUserQueues.get(message.waId) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(() => processIncomingMessage(message))
    .finally(() => {
      if (perUserQueues.get(message.waId) === next) {
        perUserQueues.delete(message.waId);
      }
    });
  perUserQueues.set(message.waId, next);
  return next;
}

// Ordering only happens through the WhatsApp Commerce catalog: the customer
// says "Hi", gets the price list with a "View catalog" button, builds a cart
// there, and sends it. This handler's job is just: welcome new customers,
// re-send the price list to returning ones, process a cart the moment it
// arrives (regardless of what state the customer was in), and walk through
// payment choice once an order exists.
async function processIncomingMessage({ waId, name, text, cartItems }: IncomingMessage): Promise<void> {
  const customer = await findOrCreateCustomer(waId, name);
  const raw = (text || '').trim();
  const upper = raw.toUpperCase();

  if (upper === whatsapp.RESUME_CHOICE_BUTTONS.resume.id) {
    return handleResumeOrder(customer);
  }

  if (upper === whatsapp.RESUME_CHOICE_BUTTONS.restart.id) {
    return handleStartNewOrder(customer);
  }

  if (cartItems && cartItems.length > 0) {
    // A fresh cart while an earlier order is still mid-checkout is an
    // explicit "I want to order again" signal - let the customer confirm
    // before we abandon the stuck one.
    if (PENDING_CHECKOUT_STATES.includes(customer.state)) {
      return promptResumeOrRestart(customer);
    }
    return handleCartOrder(customer, cartItems);
  }

  if (customer.state === 'NEW') {
    await whatsapp.sendWelcome(waId, name);
    await whatsapp.sendCatalog(waId);
    customer.state = 'CATALOG_SENT';
    await customerRepo.save(customer);
    return;
  }

  if (
    customer.state === 'AWAITING_PAYMENT_CHOICE' &&
    (upper === whatsapp.PAYMENT_CHOICE_BUTTONS.cod.id || upper === whatsapp.PAYMENT_CHOICE_BUTTONS.online.id)
  ) {
    const choice = upper === whatsapp.PAYMENT_CHOICE_BUTTONS.cod.id ? 'COD' : 'PAY';
    return handlePaymentChoice(customer, choice);
  }

  // In the address step, any non-empty text is legitimately the address
  // itself - EXCEPT something that reads like the customer trying to start
  // over (a greeting or a catalog request), which is ambiguous rather than
  // saved as their delivery address. If they're still well within the same
  // conversation (< 10 min since we last prompted them), we just re-send the
  // address prompt as a gentle nudge instead of interrupting with a choice
  // dialog - that would feel like the bot lost track mid-chat. Only once
  // they've been away longer do we ask whether to continue or start fresh.
  if (customer.state === 'AWAITING_ADDRESS' && raw.length > 0) {
    if (GREETING_RE.test(raw) || upper === 'CATALOG') {
      if (isWithinFollowUpWindow(customer)) {
        return handleResumeOrder(customer);
      }
      return promptResumeOrRestart(customer);
    }
    return handleAddressReceived(customer, raw);
  }

  // Stuck at the payment-choice or payment-link step and the message isn't
  // one of the payment buttons. Same reasoning as above: recently prompted
  // customers get a quiet re-nudge with the same step; only a longer gap
  // triggers the continue-or-restart choice.
  if (
    (customer.state === 'AWAITING_PAYMENT_CHOICE' || customer.state === 'AWAITING_PAYMENT') &&
    raw.length > 0
  ) {
    if (isWithinFollowUpWindow(customer)) {
      return handleResumeOrder(customer);
    }
    return promptResumeOrRestart(customer);
  }

  // A customer with an order still out for delivery gets a status update
  // instead of the price list/help text - they're almost certainly asking
  // "where's my order", not trying to browse or place a new one.
  const pendingOrder = await findInProgressOrder(customer);
  if (pendingOrder) {
    await whatsapp.sendOrderInProgress(waId, pendingOrder);
    return;
  }

  if (GREETING_RE.test(raw) || upper === 'CATALOG') {
    await whatsapp.sendCatalog(waId);
    return;
  }

  await whatsapp.sendHelp(waId);
}

// An order counts as "in progress" once it's past checkout (COD confirmed or
// paid online) but hasn't been marked delivered/cancelled yet - that's the
// window where a customer messaging in is almost certainly asking "where's
// my order", not trying to place a new one.
const IN_PROGRESS_STATUSES: OrderStatus[] = ['CONFIRMED'];

async function findInProgressOrder(customer: Customer) {
  if (!customer.currentOrder) return null;
  const order = await orderRepo.findById(customer.currentOrder);
  if (!order || !IN_PROGRESS_STATUSES.includes(order.status)) return null;
  return order;
}

async function promptResumeOrRestart(customer: Customer): Promise<void> {
  const order = customer.currentOrder ? await orderRepo.findById(customer.currentOrder) : null;
  if (!order) {
    // Nothing to actually resume - fall back to a clean slate.
    return handleStartNewOrder(customer);
  }
  await whatsapp.sendResumeOrRestartChoice(customer.waId, order);
}

// Re-sends whatever prompt matches the customer's current checkout step,
// without changing any state - used when they choose "Continue Order".
async function handleResumeOrder(customer: Customer): Promise<void> {
  if (!customer.currentOrder) {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  const order = await orderRepo.findById(customer.currentOrder);
  if (!order) {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  if (customer.state === 'AWAITING_ADDRESS') {
    await whatsapp.sendAskAddress(customer.waId, order);
    return;
  }

  if (customer.state === 'AWAITING_PAYMENT_CHOICE') {
    await whatsapp.sendPaymentChoice(customer.waId, order);
    return;
  }

  if (customer.state === 'AWAITING_PAYMENT' && order.razorpay.paymentLinkUrl) {
    await whatsapp.sendPaymentLink(customer.waId, order, order.razorpay.paymentLinkUrl);
    return;
  }

  await whatsapp.sendNoPendingOrder(customer.waId);
}

// Cancels whatever order the customer had mid-checkout and sends them back
// to a clean catalog - used when they choose "Start New Order".
async function handleStartNewOrder(customer: Customer): Promise<void> {
  if (customer.currentOrder) {
    const order = await orderRepo.findById(customer.currentOrder);
    if (order && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
      order.status = 'CANCELLED';
      await orderRepo.save(order);
    }
  }

  customer.currentOrder = null;
  customer.state = 'CATALOG_SENT';
  await customerRepo.save(customer);

  await whatsapp.sendCatalog(customer.waId);
}

async function handleCartOrder(customer: Customer, cartItems: CartItem[]): Promise<void> {
  const merged = mergeItemQuantities(
    cartItems
      .map((item) => {
        const product = resolveProductCode(item.retailerId, item.itemPrice);
        return product ? { product, quantity: item.quantity } : null;
      })
      .filter((x): x is { product: ProductCode; quantity: number } => x !== null)
  );

  if (merged.length === 0) {
    await whatsapp.sendCartUnresolved(customer.waId);
    return;
  }

  const items = merged.map(({ product, quantity }) => ({
    product,
    quantity,
    amount: calculateAmount(product, quantity),
  }));

  await createOrderAndAskPayment(customer, items);
}

async function createOrderAndAskPayment(
  customer: Customer,
  items: Array<{ product: ProductCode; quantity: number; amount: number }>
): Promise<void> {
  const amount = items.reduce((sum, item) => sum + item.amount, 0);

  const order = await orderRepo.create({
    customer: customer.id,
    waId: customer.waId,
    items,
    amount,
  });

  customer.currentOrder = order.id;
  customer.state = 'AWAITING_ADDRESS';
  await customerRepo.save(customer);

  await whatsapp.sendAskAddress(customer.waId, order);
}

async function handlePaymentChoice(customer: Customer, choice: 'COD' | 'PAY'): Promise<void> {
  if (!customer.currentOrder) {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  const order = await orderRepo.findById(customer.currentOrder);
  if (!order || order.status !== 'VERIFIED') {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  if (choice === 'COD') {
    order.status = 'CONFIRMED';
    order.paymentMethod = 'COD';
    order.paid = false;
    await orderRepo.save(order);

    // currentOrder is deliberately kept (not cleared) so a follow-up message
    // from this customer while the order is still out for delivery is
    // recognized as an "order in progress" check-in rather than a new order.
    customer.state = 'CATALOG_SENT';
    await customerRepo.save(customer);

    await whatsapp.sendCodConfirmation(customer.waId, order);
    return;
  }

  let link;
  try {
    link = await razorpayService.createPaymentLink(order, customer);
  } catch (err) {
    console.error(`Razorpay payment link creation failed for order ${order.id}:`, err);
    await whatsapp.sendPaymentLinkError(customer.waId);
    return;
  }

  order.status = 'AWAITING_PAYMENT';
  order.paymentMethod = 'ONLINE';
  order.razorpay = { paymentLinkId: link.id, paymentLinkUrl: link.short_url as string, paymentId: null };
  await orderRepo.save(order);

  customer.state = 'AWAITING_PAYMENT';
  await customerRepo.save(customer);

  await whatsapp.sendPaymentLink(customer.waId, order, link.short_url as string);
}

async function handleAddressReceived(customer: Customer, address: string): Promise<void> {
  if (!customer.currentOrder) {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  const order = await orderRepo.findById(customer.currentOrder);
  if (!order) {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  order.address = address;
  await orderRepo.save(order);

  customer.state = 'AWAITING_PAYMENT_CHOICE';
  await customerRepo.save(customer);

  await whatsapp.sendPaymentChoice(customer.waId, order);
}

export async function markOrderPaid(orderId: string, paymentId?: string | null): Promise<void> {
  const order = await orderRepo.findById(orderId);
  if (!order || order.paid) return;

  order.status = 'CONFIRMED';
  order.paid = true;
  order.razorpay.paymentId = paymentId || null;
  await orderRepo.save(order);

  const customer = await customerRepo.findById(order.customer);
  if (customer) {
    // currentOrder is deliberately kept (not cleared) so a follow-up message
    // from this customer while the order is still out for delivery is
    // recognized as an "order in progress" check-in rather than a new order.
    customer.state = 'CATALOG_SENT';
    await customerRepo.save(customer);
  }

  await whatsapp.sendPaidConfirmation(order.waId, order);
}
