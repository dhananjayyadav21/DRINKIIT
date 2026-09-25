import * as customerRepo from '@/data/customerRepository';
import * as orderRepo from '@/data/orderRepository';
import { ProductCode, calculateAmount } from '@/config/products';
import * as otpService from './otpService';
import * as whatsapp from './whatsappService';
import * as razorpayService from './razorpayService';
import { Customer } from '@/types/customer';

const GREETING_RE = /^h+[iey]{1,4}$|^hello+$|^menu$|^start$/i;
const OTP_RE = /^\d{6}$/;
const MAX_QUANTITY = 10000;

const MENU_PRODUCT: Record<'1' | '2', ProductCode> = { '1': '1L', '2': '500ML' };
const PAYMENT_CHOICE: Record<'1' | '2', 'COD' | 'PAY'> = { '1': 'COD', '2': 'PAY' };

export interface IncomingMessage {
  waId: string;
  name?: string | null;
  text?: string;
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

async function processIncomingMessage({ waId, name, text }: IncomingMessage): Promise<void> {
  const customer = await findOrCreateCustomer(waId, name);
  const raw = (text || '').trim();
  const upper = raw.toUpperCase();

  if (customer.state === 'NEW' || GREETING_RE.test(raw)) {
    if (customer.state === 'NEW') {
      await whatsapp.sendWelcome(waId, name);
    }
    await whatsapp.sendMenu(waId);
    customer.state = 'CATALOG_SENT';
    await customerRepo.save(customer);
    return;
  }

  if (upper === 'CATALOG') {
    await whatsapp.sendCatalog(waId);
    return;
  }

  if (upper === 'RESEND') {
    return handleResend(customer);
  }

  if (customer.state === 'CATALOG_SENT' && (raw === '1' || raw === '2')) {
    return handleProductChoice(customer, raw as '1' | '2');
  }

  if (customer.state === 'CATALOG_SENT' && raw === '3') {
    await whatsapp.sendCatalog(waId);
    return;
  }

  if (customer.state === 'AWAITING_QUANTITY' && /^\d+$/.test(raw)) {
    return handleQuantity(customer, parseInt(raw, 10));
  }

  if (customer.state === 'AWAITING_VERIFICATION' && OTP_RE.test(raw)) {
    return handleOtpVerification(customer, raw);
  }

  if (customer.state === 'AWAITING_PAYMENT_CHOICE' && (raw === '1' || raw === '2')) {
    return handlePaymentChoice(customer, PAYMENT_CHOICE[raw as '1' | '2']);
  }

  await whatsapp.sendHelp(waId);
}

async function handleProductChoice(customer: Customer, choice: '1' | '2'): Promise<void> {
  customer.pendingProduct = MENU_PRODUCT[choice];
  customer.state = 'AWAITING_QUANTITY';
  await customerRepo.save(customer);

  await whatsapp.sendAskQuantity(customer.waId, customer.pendingProduct);
}

async function handleQuantity(customer: Customer, quantity: number): Promise<void> {
  const productCode = customer.pendingProduct;

  if (!productCode || quantity < 1 || quantity > MAX_QUANTITY) {
    await whatsapp.sendHelp(customer.waId);
    return;
  }

  const amount = calculateAmount(productCode, quantity);
  const otp = otpService.generateOtp();

  const order = await orderRepo.create({
    customer: customer.id,
    waId: customer.waId,
    product: productCode,
    quantity,
    amount,
    otp,
    otpExpiresAt: otpService.newOtpExpiry(),
  });

  customer.currentOrder = order.id;
  customer.pendingProduct = null;
  customer.state = 'AWAITING_VERIFICATION';
  await customerRepo.save(customer);

  await whatsapp.sendOtp(customer.waId, otp, order);
}

async function handleResend(customer: Customer): Promise<void> {
  if (!customer.currentOrder) {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  const order = await orderRepo.findById(customer.currentOrder);
  if (!order || order.status !== 'PENDING_VERIFICATION') {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  order.otp = otpService.generateOtp();
  order.otpExpiresAt = otpService.newOtpExpiry();
  order.otpAttempts = 0;
  await orderRepo.save(order);

  customer.state = 'AWAITING_VERIFICATION';
  await customerRepo.save(customer);

  await whatsapp.sendOtp(customer.waId, order.otp, order);
}

async function handleOtpVerification(customer: Customer, code: string): Promise<void> {
  if (!customer.currentOrder) {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  const order = await orderRepo.findById(customer.currentOrder);
  if (!order || order.status !== 'PENDING_VERIFICATION') {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  if (otpService.isExpired(order.otpExpiresAt)) {
    await whatsapp.sendOtpExpired(customer.waId);
    return;
  }

  if (code !== order.otp) {
    order.otpAttempts += 1;
    await orderRepo.save(order);
    await whatsapp.sendOtpIncorrect(customer.waId);
    return;
  }

  order.status = 'VERIFIED';
  await orderRepo.save(order);

  customer.state = 'AWAITING_PAYMENT_CHOICE';
  await customerRepo.save(customer);

  await whatsapp.sendPaymentChoice(customer.waId, order);
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

    customer.state = 'CATALOG_SENT';
    customer.currentOrder = null;
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

export async function markOrderPaid(orderId: string, paymentId?: string | null): Promise<void> {
  const order = await orderRepo.findById(orderId);
  if (!order || order.paid) return;

  order.status = 'CONFIRMED';
  order.paid = true;
  order.razorpay.paymentId = paymentId || null;
  await orderRepo.save(order);

  const customer = await customerRepo.findById(order.customer);
  if (customer) {
    customer.state = 'CATALOG_SENT';
    customer.currentOrder = null;
    await customerRepo.save(customer);
  }

  await whatsapp.sendPaidConfirmation(order.waId, order);
}
