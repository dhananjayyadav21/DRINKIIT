import { Order } from '@/types/order';

// Single place for the GST rate and the tax-inclusive total shown to
// customers and admins - the order's stored `amount` (and what's actually
// charged via Razorpay) stays pre-tax; this is purely for display, so GST
// changes never require touching more than this file.
export const GST_RATE = 0.18;

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  total: number;
}

export function calculateOrderTotals(order: Pick<Order, 'amount' | 'deliveryFee'>): OrderTotals {
  const subtotal = order.amount;
  const deliveryFee = order.deliveryFee || 0;
  const taxableAmount = subtotal + deliveryFee;
  const cgst = taxableAmount * (GST_RATE / 2);
  const sgst = taxableAmount * (GST_RATE / 2);
  const total = taxableAmount + cgst + sgst;

  return { subtotal, deliveryFee, taxableAmount, cgst, sgst, total };
}
