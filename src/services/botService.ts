import * as customerRepo from '@/data/customerRepository';
import * as orderRepo from '@/data/orderRepository';
import { PRODUCTS, ProductCode, calculateAmount } from '@/config/products';
import * as otpService from './otpService';
import * as whatsapp from './whatsappService';
import * as razorpayService from './razorpayService';
import { Customer } from '@/types/customer';

const ORDER_COMMAND_RE = /^ORDER\s+(1L|500ML)\s+(\d+)$/;
const OTP_RE = /^\d{6}$/;
const MAX_QUANTITY = 10000;

export interface IncomingMessage {
  waId: string;
  name?: string | null;
  text?: string;
}

async function findOrCreateCustomer(waId: string, name?: string | null): Promise<Customer> {
  const existing = customerRepo.findByWaId(waId);
  if (existing) return existing;
  return customerRepo.create({ waId, name });
}

export async function handleIncomingMessage({ waId, name, text }: IncomingMessage): Promise<void> {
  const customer = await findOrCreateCustomer(waId, name);

  if (customer.state === 'NEW') {
    await whatsapp.sendWelcome(waId, name);
    await whatsapp.sendCatalog(waId);
    customer.state = 'CATALOG_SENT';
    await customerRepo.save(customer);
    return;
  }

  const raw = (text || '').trim();
  const upper = raw.toUpperCase();

  if (customer.state === 'AWAITING_PAYMENT_CHOICE' && (upper === 'COD' || upper === 'PAY')) {
    return handlePaymentChoice(customer, upper);
  }

  if (upper === 'CATALOG') {
    await whatsapp.sendCatalog(waId);
    return;
  }

  if (upper === 'RESEND') {
    return handleResend(customer);
  }

  const orderMatch = upper.match(ORDER_COMMAND_RE);
  if (orderMatch) {
    return handleNewOrder(customer, orderMatch[1] as ProductCode, parseInt(orderMatch[2], 10));
  }

  if (OTP_RE.test(raw)) {
    return handleOtpVerification(customer, raw);
  }

  await whatsapp.sendHelp(waId);
}

async function handleNewOrder(customer: Customer, productCode: ProductCode, quantity: number): Promise<void> {
  if (!PRODUCTS[productCode] || quantity < 1 || quantity > MAX_QUANTITY) {
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
  customer.state = 'AWAITING_VERIFICATION';
  await customerRepo.save(customer);

  await whatsapp.sendOtp(customer.waId, otp, order);
}

async function handleResend(customer: Customer): Promise<void> {
  if (!customer.currentOrder) {
    await whatsapp.sendNoPendingOrder(customer.waId);
    return;
  }

  const order = orderRepo.findById(customer.currentOrder);
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

  const order = orderRepo.findById(customer.currentOrder);
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

  const order = orderRepo.findById(customer.currentOrder);
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

  const link = await razorpayService.createPaymentLink(order, customer);

  order.status = 'AWAITING_PAYMENT';
  order.paymentMethod = 'ONLINE';
  order.razorpay = { paymentLinkId: link.id, paymentLinkUrl: link.short_url as string, paymentId: null };
  await orderRepo.save(order);

  customer.state = 'AWAITING_PAYMENT';
  await customerRepo.save(customer);

  await whatsapp.sendPaymentLink(customer.waId, order, link.short_url as string);
}

export async function markOrderPaid(orderId: string, paymentId?: string | null): Promise<void> {
  const order = orderRepo.findById(orderId);
  if (!order || order.paid) return;

  order.status = 'CONFIRMED';
  order.paid = true;
  order.razorpay.paymentId = paymentId || null;
  await orderRepo.save(order);

  const customer = customerRepo.findById(order.customer);
  if (customer) {
    customer.state = 'CATALOG_SENT';
    customer.currentOrder = null;
    await customerRepo.save(customer);
  }

  await whatsapp.sendPaidConfirmation(order.waId, order);
}
