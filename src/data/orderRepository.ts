import { MongoCollection } from './mongoCollection';
import { Order } from '@/types/order';

const orders = new MongoCollection<Order>('orders');

export function findById(id: string): Promise<Order | null> {
  return orders.findById(id);
}

export function findAll(): Promise<Order[]> {
  return orders.findAll();
}

export function create(data: Partial<Order> & Pick<Order, 'customer' | 'waId' | 'product' | 'quantity' | 'amount' | 'otp' | 'otpExpiresAt'>): Promise<Order> {
  return orders.insert({
    status: 'PENDING_VERIFICATION',
    paymentMethod: null,
    paid: false,
    otpAttempts: 0,
    razorpay: { paymentLinkId: null, paymentLinkUrl: null, paymentId: null },
    ...data,
  } as Omit<Order, 'id' | 'createdAt' | 'updatedAt'>);
}

export function save(order: Order): Promise<Order> {
  return orders.save(order);
}
