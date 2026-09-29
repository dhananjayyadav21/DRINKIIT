import Image from 'next/image';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ADMIN_COOKIE, isValidSessionToken } from '@/lib/adminAuth';
import * as orderRepo from '@/data/orderRepository';
import * as customerRepo from '@/data/customerRepository';
import { PRODUCTS } from '@/config/products';
import { env } from '@/config/env';
import PrintButton from './PrintButton';
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

  return (
    <div className={styles.page}>
      <PrintButton />

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
          <p className={styles.billName}>{customer?.name || 'WhatsApp Customer'}</p>
          <p className={styles.billLine}>+91 {order.waId}</p>
          {order.address ? (
            <p className={styles.addressBlock}>{order.address}</p>
          ) : (
            <p className={styles.addressMissing}>Delivery address not yet provided</p>
          )}
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Description</th>
              <th className={styles.center}>Qty (Boxes)</th>
              <th className={styles.center}>Pieces</th>
              <th className={styles.right}>Rate / Box</th>
              <th className={styles.right}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, i) => {
              const product = PRODUCTS[item.product];
              const pieces = item.quantity * (product?.piecesPerBox || 0);
              const rate = product?.boxPrice ?? item.amount / item.quantity;
              return (
                <tr key={i}>
                  <td>
                    <span className={styles.itemName}>{product?.label || item.product} Bottles</span>
                    <span className={styles.itemSub}>{product?.piecesPerBox} pcs / box</span>
                  </td>
                  <td className={styles.center}>{item.quantity}</td>
                  <td className={styles.center}>{pieces}</td>
                  <td className={styles.right}>₹{formatMoney(rate)}</td>
                  <td className={styles.right}>₹{formatMoney(item.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className={styles.totalsBlock}>
          <div className={styles.totalsRow}>
            <span>Subtotal</span>
            <span>₹{formatMoney(order.amount)}</span>
          </div>
          <div className={styles.totalsRow}>
            <span>Delivery</span>
            <span>{order.deliveryFee ? `₹${formatMoney(order.deliveryFee)}` : 'Free'}</span>
          </div>
          <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
            <span>Total Due</span>
            <span>₹{formatMoney(order.amount + (order.deliveryFee || 0))}</span>
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
  );
}
