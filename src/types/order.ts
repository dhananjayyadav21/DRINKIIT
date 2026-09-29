import { ProductCode } from '@/config/products';

export type OrderStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'DELIVERED';

export type PaymentMethod = 'COD' | 'ONLINE' | null;

export interface OrderItem {
  product: ProductCode;
  quantity: number;
  amount: number;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  customer: string;
  waId: string;
  items: OrderItem[];
  amount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paid: boolean;
  address: string | null;
  // Optional manual delivery charge an admin can add for COD orders (e.g. for
  // out-of-radius deliveries). Left null when the standard free delivery applies.
  deliveryFee: number | null;
  otp: string;
  otpExpiresAt: string;
  otpAttempts: number;
  razorpay: {
    paymentLinkId: string | null;
    paymentLinkUrl: string | null;
    paymentId: string | null;
  };
}
