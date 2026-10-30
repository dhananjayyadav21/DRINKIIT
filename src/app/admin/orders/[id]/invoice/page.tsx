import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ADMIN_COOKIE, isValidSessionToken } from '@/lib/adminAuth';
import * as orderRepo from '@/data/orderRepository';
import * as customerRepo from '@/data/customerRepository';
import { PRODUCTS } from '@/config/products';
import { env } from '@/config/env';
import PrintButton from './PrintButton';
import { calculateOrderTotals } from '@/services/pricing';
import styles from './invoice.module.css';

function formatMoney(amount: number): string {
  return Number(amount).toFixed(2);
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const order = await orderRepo.findById(id);
  if (!order) notFound();

  const customer = await customerRepo.findById(order.customer);
  const invoiceNumber = `INV-${order.id}`;
  const invoiceDate = new Date(order.createdAt);
  const isPaid = order.paid;

  const paymentMethodLabel =
    order.paymentMethod === 'COD'
      ? 'Cash on Delivery'
      : order.paymentMethod === 'ONLINE'
      ? 'Online (Razorpay)'
      : 'Not selected yet';

  const { cgst, sgst, total: grandTotal } = calculateOrderTotals(order);

  return (
    <div className={styles.page}>
      <div className={styles.toolbarBar}>
        <div className={styles.toolbar}>
          <Link href={`/admin/orders/${order.id}`} className={styles.backLink}>
            <svg viewBox="0 0 20 20" className={styles.backIcon} fill="none" aria-hidden="true">
              <path
                d="M12.5 4.5 7 10l5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to order
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className={styles.sheetWrap}>
        <div className={styles.sheet}>
        <div className={styles.header}>
          <div className={styles.brandBlock}>
            <Image src="/images/logo.jpg" alt={`${env.business.name} logo`} width={56} height={56} className={styles.logo} />
            <div>
              <h1 className={styles.brand}>{env.business.name}</h1>
              {env.business.address && <p className={styles.brandLine}>{env.business.address}</p>}
              <p className={styles.brandLine}>
                {env.business.contactPhone && `+91 ${env.business.contactPhone}`}
                {env.business.contactPhone && env.business.contactEmail && '  ·  '}
                {env.business.contactEmail}
              </p>
              {env.business.gstNumber && <p className={styles.brandLine}>GSTIN: {env.business.gstNumber}</p>}
            </div>
          </div>
          <div className={styles.invoiceMeta}>
            <h2 className={styles.invoiceTitle}>TAX INVOICE</h2>
            <span className={`${styles.statusPill} ${isPaid ? styles.statusPaid : styles.statusUnpaid}`}>
              {isPaid ? 'PAID' : 'UNPAID'}
            </span>
          </div>
        </div>

        <div className={styles.metaGrid}>
          <div>
            <p className={styles.metaLabel}>Invoice Number</p>
            <p className={styles.metaValue}>{invoiceNumber}</p>
          </div>
          <div>
            <p className={styles.metaLabel}>Invoice Date</p>
            <p className={styles.metaValue}>
              {invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className={styles.metaLabel}>Order ID</p>
            <p className={styles.metaValue}>{order.id}</p>
          </div>
          <div>
            <p className={styles.metaLabel}>Payment Method</p>
            <p className={styles.metaValue}>{paymentMethodLabel}</p>
          </div>
        </div>

        <div className={styles.billTo}>
          <h3 className={styles.sectionLabel}>Billed To</h3>
          <div className={styles.billCard}>
            <div className={styles.billIdentity}>
              <p className={styles.billName}>{customer?.name || 'WhatsApp Customer'}</p>
              <p className={styles.billPhone}>
                <svg viewBox="0 0 20 20" className={styles.billIcon} fill="none" aria-hidden="true">
                  <path
                    d="M6.1 3.5h2l1 3-1.6 1.1a8 8 0 0 0 4.9 4.9l1.1-1.6 3 1v2a1.3 1.3 0 0 1-1.4 1.3A12.5 12.5 0 0 1 4.8 4.9a1.3 1.3 0 0 1 1.3-1.4Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                +91 {order.waId}
              </p>
            </div>
            <div className={styles.billAddress}>
              {order.address ? (
                <p className={styles.addressBlock}>
                  <svg viewBox="0 0 20 20" className={styles.billIcon} fill="none" aria-hidden="true">
                    <path
                      d="M10 18s6-5.2 6-9.6A6 6 0 0 0 4 8.4C4 12.8 10 18 10 18Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                    <circle cx="10" cy="8.2" r="2" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  <span>{order.address}</span>
                </p>
              ) : (
                <p className={styles.addressMissing}>Delivery address not yet provided</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.table} role="table">
          <div className={`${styles.tableRow} ${styles.tableHead}`} role="row">
            <span role="columnheader">Description</span>
            <span className={styles.center} role="columnheader">Qty (Boxes)</span>
            <span className={styles.center} role="columnheader">Pieces</span>
            <span className={styles.right} role="columnheader">Rate / Box</span>
            <span className={styles.right} role="columnheader">Amount</span>
          </div>
          {(order.items || []).map((item, i) => {
            const product = PRODUCTS[item.product];
            const pieces = item.quantity * (product?.piecesPerBox || 0);
            const rate = product?.boxPrice ?? item.amount / item.quantity;
            return (
              <div className={styles.tableRow} role="row" key={i}>
                <span role="cell">
                  <span className={styles.itemName}>{product?.label || item.product} Bottles</span>
                  <span className={styles.itemSub}>{product?.piecesPerBox} pcs / box</span>
                </span>
                <span className={styles.center} role="cell">{item.quantity}</span>
                <span className={styles.center} role="cell">{pieces}</span>
                <span className={styles.right} role="cell">₹{formatMoney(rate)}</span>
                <span className={styles.right} role="cell">₹{formatMoney(item.amount)}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.summaryRow}>
          <div className={styles.notesBlock}>
            <h3 className={styles.sectionLabel}>Notes</h3>
            <ul className={styles.notesList}>
              <li>Goods once sold on hygiene grounds are non-returnable.</li>
              <li>Please verify the seal is intact before accepting delivery.</li>
              <li>For any order queries, reach us on WhatsApp or the contact above.</li>
            </ul>
          </div>

          <div className={styles.totalsBlock}>
            <div className={styles.totalsRow}>
              <span>Subtotal</span>
              <span>₹{formatMoney(order.amount)}</span>
            </div>
            <div className={styles.totalsRow}>
              <span>Delivery</span>
              <span>{order.deliveryFee ? `₹${formatMoney(order.deliveryFee)}` : 'Free'}</span>
            </div>
            <div className={styles.taxDivider} />
            <div className={styles.totalsRow}>
              <span>
                CGST <span className={styles.taxRate}>@ 9%</span>
              </span>
              <span>₹{formatMoney(cgst)}</span>
            </div>
            <div className={styles.totalsRow}>
              <span>
                SGST <span className={styles.taxRate}>@ 9%</span>
              </span>
              <span>₹{formatMoney(sgst)}</span>
            </div>
            <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
              <span>Total Due</span>
              <span>₹{formatMoney(grandTotal)}</span>
            </div>
            <p className={styles.taxNote}>Inclusive of CGST + SGST on taxable value (goods + delivery)</p>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerNote}>
            This is a system-generated invoice from {env.business.name} and does not require a signature.
          </p>
          <p className={styles.footerThanks}>Thank you for your business!</p>
        </div>
      </div>
      </div>
    </div>
  );
}
