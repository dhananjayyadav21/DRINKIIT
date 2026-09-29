import crypto from 'crypto';
import { MongoCollection } from './mongoCollection';
import { Order } from '@/types/order';

const orders = new MongoCollection<Order>('orders');

// Short, human-friendly order IDs (e.g. "A3K9XZ7QPL2M") instead of a 36-char
// UUID - easier to read back over WhatsApp and to key in on the admin
// dashboard. Excludes visually ambiguous characters (0/O, 1/I).
const ORDER_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ORDER_ID_LENGTH = 12;

function generateOrderId(): string {
  const bytes = crypto.randomBytes(ORDER_ID_LENGTH);
  let id = '';
  for (let i = 0; i < ORDER_ID_LENGTH; i++) {
    id += ORDER_ID_CHARS[bytes[i] % ORDER_ID_CHARS.length];
  }
  return id;
}

export function findById(id: string): Promise<Order | null> {
  return orders.findById(id);
}

export function findAll(): Promise<Order[]> {
  return orders.findAll();
}

export function create(data: Partial<Order> & Pick<Order, 'customer' | 'waId' | 'items' | 'amount'>): Promise<Order> {
  return orders.insert(
    {
      status: 'VERIFIED',
      paymentMethod: null,
      paid: false,
      address: null,
      deliveryFee: null,
      otp: '',
      otpExpiresAt: '',
      otpAttempts: 0,
      razorpay: { paymentLinkId: null, paymentLinkUrl: null, paymentId: null },
      ...data,
    } as Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    generateOrderId()
  );
}

export function save(order: Order): Promise<Order> {
  return orders.save(order);
}
