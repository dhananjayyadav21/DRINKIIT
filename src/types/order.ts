import { ProductCode } from '@/config/products';

export type OrderStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'DELIVERED';

export type PaymentMethod = 'COD' | 'ONLINE' | null;

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  customer: string;
  waId: string;
  product: ProductCode;
  quantity: number;
  amount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paid: boolean;
  otp: string;
  otpExpiresAt: string;
  otpAttempts: number;
  razorpay: {
    paymentLinkId: string | null;
    paymentLinkUrl: string | null;
    paymentId: string | null;
  };
}
