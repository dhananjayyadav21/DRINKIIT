'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PRODUCTS } from '@/config/products';
import { Order, OrderStatus } from '@/types/order';
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

export default function OrderGrid({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.id.toLowerCase().includes(q));
  }, [orders, query]);

  return (
    <>
      <div className={styles.searchBar}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Order ID…"
          className={styles.searchInput}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className={styles.clearSearchLink}>
            Clear
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyStateCard}>
          No orders yet — they will show up here as customers order on WhatsApp.
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyStateCard}>No orders match “{query}”.</div>
      ) : (
        <div className={styles.orderGrid}>
          {filtered.map((order) => {
            const itemsSummary = (order.items || [])
              .map((item) => `${PRODUCTS[item.product]?.label || item.product} × ${item.quantity}`)
              .join(', ');

            const needsAction = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

            return (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className={styles.orderCard}>
                <div className={styles.orderCardTop}>
                  <span className={`${styles.mono} ${styles.orderId}`}>{order.id}</span>
                  <span className={`${styles.badge} ${STATUS_BADGE[order.status]}`}>
                    <span className={styles.dot} />
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                <p className={styles.orderCardItems}>{itemsSummary || '—'}</p>

                <div className={styles.orderCardMeta}>
                  <div>
                    <p className={styles.orderCardCustomer}>{order.waId}</p>
                    <p className={styles.orderCardDate}>{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <p className={styles.orderCardAmount}>₹{order.amount}</p>
                </div>

                <div className={styles.orderCardFooter}>
                  {order.paymentMethod === 'COD' ? (
                    <span className={`${styles.badge} ${order.paid ? styles.badgeGreen : styles.badgeGray}`}>
                      {order.paid ? 'Paid (COD)' : 'COD — Unpaid'}
                    </span>
                  ) : order.paymentMethod === 'ONLINE' ? (
                    <span className={`${styles.badge} ${order.paid ? styles.badgeGreen : styles.badgeOrange}`}>
                      {order.paid ? 'Paid Online' : 'Unpaid'}
                    </span>
                  ) : (
                    <span className={styles.doneLabel}>—</span>
                  )}
                  {needsAction && <span className={styles.actionNeeded}>Action needed →</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
