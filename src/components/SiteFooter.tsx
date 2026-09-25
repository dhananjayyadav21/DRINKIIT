import Image from 'next/image';
import Link from 'next/link';
import styles from './site.module.css';
import { env } from '@/config/env';

export default function SiteFooter() {
  const { contactPhone, contactEmail, address } = env.business;

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <div className={styles.footerBrand}>
              <Image src="/images/logo.jpg" alt="DRINK iT" width={32} height={32} className={styles.brandLogo} />
              Drink iT
            </div>
            <p className={styles.footerTagline}>Drink well. Think well.</p>
            <div className={styles.footerLinks}>
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/privacy">Privacy Policy</Link>
            </div>
          </div>

          {(contactPhone || contactEmail || address) && (
            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Contact Us</p>
              {address && <p className={styles.footerContactText}>{address}</p>}
              {contactPhone && (
                <p className={styles.footerContactText}>
                  <a href={`tel:+${contactPhone.replace(/^0+/, '')}`}>+91 {contactPhone}</a>
                </p>
              )}
              {contactEmail && (
                <p className={styles.footerContactText}>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </p>
              )}
            </div>
          )}
        </div>

        <p className={styles.footerCopy}>© {new Date().getFullYear()} DRINK iT. All rights reserved.</p>
      </div>
    </footer>
  );
}
