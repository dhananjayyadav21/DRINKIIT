import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ADMIN_COOKIE, isValidSessionToken } from '@/lib/adminAuth';
import * as orderRepo from '@/data/orderRepository';
import * as customerRepo from '@/data/customerRepository';
import { PRODUCTS } from '@/config/products';
import { OrderStatus } from '@/types/order';
import { markDelivered, markPaid, setDeliveryFee } from '../../actions';
import SubmitButton from '../../SubmitButton';
import { calculateOrderTotals } from '@/services/pricing';
import styles from '../../admin.module.css';

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

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const order = await orderRepo.findById(id);
  if (!order) notFound();

  const customer = await customerRepo.findById(order.customer);
  const razorpay = order.razorpay || { paymentLinkId: null, paymentLinkUrl: null, paymentId: null };
  const isFinal = order.status === 'DELIVERED' || order.status === 'CANCELLED';

  const { cgst, sgst, total: grandTotal } = calculateOrderTotals(order);

  // The stored address string includes a trailing "Phone: ..." line (captured
  // from the WhatsApp address form) - drop it here since the WhatsApp number
  // is already shown as its own field above.
  const addressLines = order.address?.split('\n').filter((line) => !line.startsWith('Phone:')) || [];

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <Image src="/images/logo.jpg" alt="DRINK IT" width={44} height={44} className={styles.logo} />
            <div>
              <h1 className={styles.title}>Order {order.id}</h1>
              <p className={styles.subtitle}>Placed {new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <Link href="/admin" className={styles.logoutButton}>
            ← Back to orders
          </Link>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.detailGrid}>
          <div className={styles.detailColumn}>
            <div className={styles.detailCard}>
              <div className={styles.detailCardHeader}>
                <h2 className={styles.detailCardTitle}>Order Items</h2>
                <span className={`${styles.badge} ${STATUS_BADGE[order.status]}`}>
                  <span className={styles.dot} />
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <div className={styles.itemsList}>
                {(order.items || []).map((item, i) => {
                  const product = PRODUCTS[item.product];
                  const pieces = item.quantity * (product?.piecesPerBox || 0);
                  return (
                    <div key={i} className={styles.itemRow}>
                      <div>
                        <p className={styles.itemName}>{product?.label || item.product}</p>
                        <p className={styles.itemMeta}>
                          {item.quantity} Box{item.quantity > 1 ? 'es' : ''} ({pieces} pcs)
                        </p>
                      </div>
                      <p className={styles.itemAmount}>₹{item.amount}</p>
                    </div>
                  );
                })}
              </div>

              <div className={styles.subtotalsBlock}>
                {order.deliveryFee ? (
                  <>
                    <div className={styles.subtotalRow}>
                      <span>Items Subtotal</span>
                      <span>₹{order.amount}</span>
                    </div>
                    <div className={styles.subtotalRow}>
                      <span>Delivery Fee</span>
                      <span>₹{order.deliveryFee.toFixed(2)}</span>
                    </div>
                  </>
                ) : null}

                <div className={styles.taxDivider} />

                <div className={styles.subtotalRow}>
                  <span>
                    CGST <span className={styles.taxRate}>@ 9%</span>
                  </span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div className={styles.subtotalRow}>
                  <span>
                    SGST <span className={styles.taxRate}>@ 9%</span>
                  </span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalAmount}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.detailCardHeader}>
                <h2 className={styles.detailCardTitle}>Payment</h2>
                <span className={`${styles.badge} ${order.paid ? styles.badgeGreen : styles.badgeOrange}`}>
                  {order.paid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <dl className={styles.detailList}>
                <div>
                  <dt>Method</dt>
                  <dd>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod === 'ONLINE' ? 'Online (Razorpay)' : '—'}</dd>
                </div>
                {razorpay.paymentId && (
                  <div>
                    <dt>Payment ID</dt>
                    <dd className={styles.mono}>{razorpay.paymentId}</dd>
                  </div>
                )}
                {razorpay.paymentLinkId && !order.paid && (
                  <div>
                    <dt>Payment Link</dt>
                    <dd className={styles.mono}>{razorpay.paymentLinkId}</dd>
                  </div>
                )}
              </dl>

              {order.paymentMethod === 'COD' && (
                <div className={styles.deliveryFeeSection}>
                  <p className={styles.deliveryFeeLabel}>
                    Delivery Fee <span className={styles.optionalTag}>optional</span>
                  </p>
                  <p className={styles.deliveryFeeHint}>
                    Add a charge for this delivery (e.g. outside the free-delivery radius). Leave blank for free delivery.
                  </p>
                  <form action={setDeliveryFee.bind(null, order.id)} className={styles.deliveryFeeForm}>
                    <div className={styles.deliveryFeeInputWrap}>
                      <span className={styles.deliveryFeePrefix}>₹</span>
                      <input
                        type="number"
                        name="deliveryFee"
                        min="0"
                        step="0.01"
                        defaultValue={order.deliveryFee ?? ''}
                        placeholder="0.00"
                        className={styles.deliveryFeeInput}
                      />
                    </div>
                    <SubmitButton pendingLabel="Saving…" className={styles.deliveryFeeButton}>
                      {order.deliveryFee != null ? 'Update' : 'Add Fee'}
                    </SubmitButton>
                  </form>
                  {order.deliveryFee != null && (
                    <p className={styles.deliveryFeeCurrent}>Current fee: ₹{order.deliveryFee.toFixed(2)}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.detailColumn}>
            <div className={styles.detailCard}>
              <h2 className={styles.detailCardTitle}>Customer</h2>
              <dl className={styles.detailList}>
                <div>
                  <dt>Name</dt>
                  <dd>{customer?.name || '—'}</dd>
                </div>
                <div>
                  <dt>WhatsApp Number</dt>
                  <dd>
                    <a href={`https://wa.me/${order.waId}`} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
                      <svg viewBox="0 0 20 20" className={styles.inlineIcon} fill="none" aria-hidden="true">
                        <path
                          d="M6.1 3.5h2l1 3-1.6 1.1a8 8 0 0 0 4.9 4.9l1.1-1.6 3 1v2a1.3 1.3 0 0 1-1.4 1.3A12.5 12.5 0 0 1 4.8 4.9a1.3 1.3 0 0 1 1.3-1.4Z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      +91 {order.waId}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Delivery Address</dt>
                  <dd>
                    {addressLines.length > 0 ? (
                      <span className={styles.addressText}>
                        <svg viewBox="0 0 20 20" className={styles.inlineIcon} fill="none" aria-hidden="true">
                          <path
                            d="M10 18s6-5.2 6-9.6A6 6 0 0 0 4 8.4C4 12.8 10 18 10 18Z"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinejoin="round"
                          />
                          <circle cx="10" cy="8.2" r="2" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                        <span>
                          {addressLines.map((line, i) => (
                            <span key={i} className={styles.addressLine}>
                              {line}
                            </span>
                          ))}
                        </span>
                      </span>
                    ) : (
                      <span className={styles.addressMissing}>Not provided yet</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailCard}>
              <h2 className={styles.detailCardTitle}>Actions</h2>
              <div className={styles.actionsStack}>
                {!isFinal && !order.paid && (
                  <form action={markPaid.bind(null, order.id)}>
                    <SubmitButton pendingLabel="Marking as paid…" className={styles.actionButton} light>
                      Mark as Paid
                    </SubmitButton>
                  </form>
                )}

                {!isFinal && order.paid && (
                  <form action={markDelivered.bind(null, order.id)}>
                    <SubmitButton pendingLabel="Marking as delivered…" className={styles.actionButton} light>
                      Mark as Delivered
                    </SubmitButton>
                  </form>
                )}

                <Link href={`/admin/orders/${order.id}/invoice`} target="_blank" className={styles.secondaryActionButton}>
                  <svg viewBox="0 0 20 20" className={styles.inlineIcon} fill="none" aria-hidden="true">
                    <path
                      d="M6 2.5h5.5L15 6v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                    <path d="M11.5 2.5V6H15" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M7.5 10.5h5M7.5 13h5M7.5 15.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Download Invoice
                </Link>

                {!isFinal && !order.paid && (
                  <p className={styles.actionHint}>Mark the order paid before it can be marked delivered.</p>
                )}

                {isFinal && <p className={styles.actionHint}>This order is {STATUS_LABEL[order.status].toLowerCase()}.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
