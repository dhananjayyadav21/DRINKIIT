import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '@/config/env';
import { PRODUCTS } from '@/config/products';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret,
});

export async function createPaymentLink(order: Order, customer: Customer) {
  const product = PRODUCTS[order.product];

  const link = await razorpay.paymentLink.create({
    amount: Math.round(order.amount * 100), // paise
    currency: 'INR',
    accept_partial: false,
    description: `${env.business.name} order - ${product.label} x ${order.quantity}`,
    reference_id: order.id,
    customer: {
      contact: `+${customer.waId}`,
      name: customer.name || undefined,
    },
    notify: { sms: false, email: false },
    notes: { orderId: order.id, waId: customer.waId },
  });

  return link;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');

  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
