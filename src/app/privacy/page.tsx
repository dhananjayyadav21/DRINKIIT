import type { Metadata } from 'next';
import styles from '@/components/site.module.css';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { env } from '@/config/env';

export const metadata: Metadata = {
  title: `Privacy Policy – ${env.business.name}`,
};

const LAST_UPDATED = 'September 25, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.contentPage}>
      <SiteNav />

      <div className={styles.contentHero}>
        <div className={styles.contentHeroInner}>
          <span className={styles.eyebrow}>Legal</span>
          <h1 className={styles.pageTitle}>Privacy Policy</h1>
          <p className={styles.updatedAt}>Last updated: {LAST_UPDATED}</p>
          <p className={styles.pageLead}>
            This Privacy Policy explains how {env.business.name} (&quot;we&quot;, &quot;us&quot;) collects, uses
            and protects your information when you place an order with us over WhatsApp or use our
            admin dashboard.
          </p>
        </div>
      </div>

      <main className={styles.contentInner}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Information we collect</h2>
          <ul className={styles.bulletList}>
            <li>Your WhatsApp number and display name, to identify you and process orders</li>
            <li>Order details — product, quantity, amount and delivery-related information</li>
            <li>Payment status and payment reference IDs when you pay online via Razorpay</li>
            <li>Message content you send us on WhatsApp, to respond to and fulfil your order</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>How we use your information</h2>
          <p className={styles.sectionText}>We use the information we collect to:</p>
          <ul className={styles.bulletList}>
            <li>Confirm, verify and process your orders</li>
            <li>Communicate order updates, OTP verification codes and payment links</li>
            <li>Coordinate delivery of your order</li>
            <li>Improve our service and respond to support queries</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Payment information</h2>
          <p className={styles.sectionText}>
            Online payments are processed securely by Razorpay. We do not store your card, UPI or
            bank details on our servers — Razorpay handles payment data directly under its own
            security and privacy standards.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Data sharing</h2>
          <p className={styles.sectionText}>
            We do not sell or rent your personal information. We only share order-related information
            with trusted service providers (such as WhatsApp/Meta, Twilio and Razorpay) as necessary
            to process and deliver your order, or when required by law.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Data retention</h2>
          <p className={styles.sectionText}>
            We retain order and customer information for as long as necessary to fulfil orders,
            maintain records for accounting purposes, and comply with legal obligations.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your choices</h2>
          <p className={styles.sectionText}>
            You can stop receiving messages from us at any time by simply not messaging our WhatsApp
            number. To request access to, correction of, or deletion of your data, contact us on
            WhatsApp with your request.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Changes to this policy</h2>
          <p className={styles.sectionText}>
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with an updated revision date.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact us</h2>
          <p className={styles.sectionText}>
            If you have questions about this Privacy Policy, message us on WhatsApp or reach out
            directly:
          </p>
          <ul className={styles.bulletList}>
            {env.business.address && <li>{env.business.address}</li>}
            {env.business.contactPhone && (
              <li>
                Phone: <a href={`tel:+${env.business.contactPhone}`}>+91 {env.business.contactPhone}</a>
              </li>
            )}
            {env.business.contactEmail && (
              <li>
                Email: <a href={`mailto:${env.business.contactEmail}`}>{env.business.contactEmail}</a>
              </li>
            )}
          </ul>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
