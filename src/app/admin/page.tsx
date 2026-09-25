import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, isValidSessionToken } from '@/lib/adminAuth';
import * as orderRepo from '@/data/orderRepository';
import { Order, OrderStatus } from '@/types/order';
import { logout, markDelivered } from './actions';
import styles from './admin.module.css';

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING_VERIFICATION: styles.badgeGray,
  VERIFIED: styles.badgeBlue,
  AWAITING_PAYMENT: styles.badgeOrange,
  CONFIRMED: styles.badgeGreen,
  DELIVERED: styles.badgePurple,
  CANCELLED: styles.badgeRed,
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_VERIFICATION: 'Pending OTP',
  VERIFIED: 'Verified',
  AWAITING_PAYMENT: 'Awaiting Payment',
  CONFIRMED: 'Confirmed',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function shortId(id: string): string {
  return id.slice(0, 8);
}

function PaymentCell({ order }: { order: Order }) {
  if (order.paymentMethod === 'COD') {
    return <span className={`${styles.badge} ${styles.badgeGray}`}>COD</span>;
  }

  if (order.paymentMethod === 'ONLINE') {
    if (order.paid) {
      return (
        <div>
          <span className={`${styles.badge} ${styles.badgeGreen}`}>
            <span className={styles.dot} />
            Paid online
          </span>
          {order.razorpay.paymentId && (
            <span className={`${styles.paymentRef} ${styles.mono}`} title={order.razorpay.paymentId}>
              {order.razorpay.paymentId}
            </span>
          )}
        </div>
      );
    }
    return (
      <div>
        <span className={`${styles.badge} ${styles.badgeOrange}`}>
          <span className={styles.dot} />
          Unpaid
        </span>
        {order.razorpay.paymentLinkId && (
          <span className={`${styles.paymentRef} ${styles.mono}`} title={order.razorpay.paymentLinkId}>
            link: {order.razorpay.paymentLinkId}
          </span>
        )}
      </div>
    );
  }

  return <span className={styles.doneLabel}>—</span>;
}

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
            <Image src="/images/logo.jpg" alt="DRINK iT" width={44} height={44} className={styles.logo} />
            <div>
              <h1 className={styles.title}>Orders Dashboard</h1>
              <p className={styles.subtitle}>Track and complete customer orders</p>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className={styles.logoutButton}>
              Log out
            </button>
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

        <div className={styles.card}>
          {orders.length === 0 ? (
            <div className={styles.emptyState}>No orders yet — they will show up here as customers order on WhatsApp.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Placed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className={`${styles.mono} ${styles.orderId}`} title={order.id}>
                          {shortId(order.id)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.customerName}>{order.waId}</div>
                        <div className={styles.customerPhone}>WhatsApp customer</div>
                      </td>
                      <td>
                        {order.product} × {order.quantity}
                      </td>
                      <td className={styles.amount}>₹{order.amount}</td>
                      <td>
                        <PaymentCell order={order} />
                      </td>
                      <td>
                        <span className={`${styles.badge} ${STATUS_BADGE[order.status]}`}>
                          <span className={styles.dot} />
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className={styles.placedAt}>{new Date(order.createdAt).toLocaleString()}</td>
                      <td>
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? (
                          <form action={markDelivered.bind(null, order.id)}>
                            <button type="submit" className={styles.actionButton}>
                              Mark Complete
                            </button>
                          </form>
                        ) : (
                          <span className={styles.doneLabel}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
