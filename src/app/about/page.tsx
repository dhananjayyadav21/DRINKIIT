import type { Metadata } from 'next';
import styles from '@/components/site.module.css';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { env } from '@/config/env';

export const metadata: Metadata = {
  title: `About – ${env.business.name}`,
};

export default function AboutPage() {
  return (
    <div className={styles.contentPage}>
      <SiteNav />

      <div className={styles.contentHero}>
        <div className={styles.contentHeroInner}>
          <span className={styles.eyebrow}>About Us</span>
          <h1 className={styles.pageTitle}>We deliver clean water, the easy way</h1>
          <p className={styles.pageLead}>
            {env.business.name} supplies purified drinking water bottles to homes, offices and shops.
            We built our entire ordering experience around WhatsApp so getting water delivered is as
            simple as sending a message.
          </p>
        </div>
      </div>

      <main className={styles.contentInner}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What we do</h2>
          <p className={styles.sectionText}>
            We supply sealed 1 litre and 500ml purified water bottles in bulk boxes, ideal for daily
            household use, offices and events. Every order is confirmed instantly over WhatsApp and
            delivered free within our service radius.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Why customers choose us</h2>
          <ul className={styles.bulletList}>
            <li>Order directly on WhatsApp — no app installs, no account setup</li>
            <li>Transparent, per-bottle pricing with no hidden charges</li>
            <li>Free delivery within {env.business.freeDeliveryRadiusKm}km of our service area</li>
            <li>Flexible payment — Cash on Delivery or secure online payment</li>
            <li>Fast order confirmation with OTP verification for every order</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Our promise</h2>
          <p className={styles.sectionText}>
            Every bottle we deliver is sealed and sourced for quality. We aim to make ordering water
            as fast and reliable as sending a text — because clean drinking water shouldn&apos;t be a
            hassle to get.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Get in touch</h2>
          <p className={styles.sectionText}>
            Have a question or a bulk order request? Message us on WhatsApp and our team will get
            back to you shortly. You can also reach us directly:
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
