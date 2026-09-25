'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ADMIN_COOKIE, issueSessionToken, verifyCredentials } from '@/lib/adminAuth';
import * as orderRepo from '@/data/orderRepository';

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

export async function markDelivered(orderId: string): Promise<void> {
  const order = orderRepo.findById(orderId);
  if (!order) return;
  order.status = 'DELIVERED';
  await orderRepo.save(order);
  revalidatePath('/admin');
}
