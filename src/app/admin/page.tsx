import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, isValidSessionToken } from '@/lib/adminAuth';
import * as orderRepo from '@/data/orderRepository';
import { logout } from './actions';
import OrderGrid from './OrderGrid';
import SubmitButton from './SubmitButton';
import styles from './admin.module.css';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    redirect('/admin/login');
  }

  const allOrders = await orderRepo.findAll();
  const orders = allOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const stats = {
    total: orders.length,
    awaitingPayment: orders.filter((o) => o.status === 'AWAITING_PAYMENT').length,
    confirmed: orders.filter((o) => o.status === 'CONFIRMED').length,
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <Image src="/images/logo.jpg" alt="DRINK IT" width={44} height={44} className={styles.logo} />
            <div>
              <h1 className={styles.title}>Orders Dashboard</h1>
              <p className={styles.subtitle}>Track and complete customer orders</p>
            </div>
          </div>
          <form action={logout}>
            <SubmitButton pendingLabel="Logging out…" className={styles.logoutButton}>
              Log out
            </SubmitButton>
          </form>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total Orders</p>
            <p className={styles.statValue}>{stats.total}</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Awaiting Payment</p>
            <p className={styles.statValue}>{stats.awaitingPayment}</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Confirmed</p>
            <p className={styles.statValue}>{stats.confirmed}</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Delivered</p>
            <p className={styles.statValue}>{stats.delivered}</p>
          </div>
        </div>

        <OrderGrid orders={orders} />
      </div>
    </div>
  );
}
