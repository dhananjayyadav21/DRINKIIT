'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, issueSessionToken, verifyCredentials } from '@/lib/adminAuth';
import * as orderRepo from '@/data/orderRepository';
import * as whatsapp from '@/services/whatsappService';

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!verifyCredentials(email, password)) {
    redirect('/admin/login?error=1');
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, issueSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/admin');
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect('/');
}

export async function markPaid(orderId: string): Promise<void> {
  const order = await orderRepo.findById(orderId);
  if (!order || order.paid) return;
  order.paid = true;
  await orderRepo.save(order);
  revalidatePath('/admin');
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function markDelivered(orderId: string): Promise<void> {
  const order = await orderRepo.findById(orderId);
  if (!order || !order.paid) return;
  order.status = 'DELIVERED';
  await orderRepo.save(order);
  revalidatePath('/admin');
  revalidatePath(`/admin/orders/${orderId}`);
  await whatsapp.sendOrderDelivered(order.waId, order);
}

// Optional, admin-entered delivery charge (e.g. for an out-of-radius COD
// order) - left unset for the standard free delivery. Passing an empty
// value clears a previously set fee.
export async function setDeliveryFee(orderId: string, formData: FormData): Promise<void> {
  const order = await orderRepo.findById(orderId);
  if (!order) return;

  const raw = String(formData.get('deliveryFee') || '').trim();
  if (raw === '') {
    order.deliveryFee = null;
  } else {
    const fee = Number(raw);
    if (!Number.isFinite(fee) || fee < 0) return;
    order.deliveryFee = Math.round(fee * 100) / 100;
  }

  await orderRepo.save(order);
  revalidatePath('/admin');
  revalidatePath(`/admin/orders/${orderId}`);
}
