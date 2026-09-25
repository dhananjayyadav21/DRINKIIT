import Image from 'next/image';
import Link from 'next/link';
import styles from './home.module.css';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { env } from '@/config/env';
import { PRODUCTS, unitPrice } from '@/config/products';

function formatMoney(amount: number): string {
  return Number(amount).toFixed(2).replace(/\.00$/, '');
}

function whatsappLink(prefill?: string): string {
  if (!env.business.whatsappNumber) return '/admin';
  const text = prefill ? `?text=${encodeURIComponent(prefill)}` : '';
  return `https://wa.me/${env.business.whatsappNumber}${text}`;
}

const TRUST_ITEMS = [
  { icon: '💧', label: 'Purified & sealed bottles' },
  { icon: '🚚', label: `Free delivery within ${env.business.freeDeliveryRadiusKm}km` },
  { icon: '⚡', label: 'Order in under a minute' },
  { icon: '🔒', label: 'Secure online payments' },
];

const BRANDS = [
  { code: '1L' as const, name: 'Puresy', image: '/images/puresy-banner-outdoor.png' },
  { code: '500ML' as const, name: 'Detox', image: '/images/detox-banner-outdoor.png' },
];

const STEPS = [
  {
    title: 'Message us on WhatsApp',
    text: 'Say hi or type CATALOG to see our current prices for 1L and 500ml bottles.',
  },
  {
    title: 'Place your order',
    text: 'Send ORDER 1L 12 (or any quantity) — we confirm it with a quick OTP verification.',
  },
  {
    title: 'Pay & relax',
    text: 'Choose Cash on Delivery or pay online. Our team delivers straight to your door.',
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <SiteNav />

      <section className={styles.heroBand}>
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              Now taking orders on WhatsApp
            </div>
            <h1 className={styles.title}>
              Pure water,
              <br />
              <span className={styles.titleAccent}>delivered with care</span>
            </h1>
            <p className={styles.subtitle}>
              {env.business.name} delivers trusted, packaged drinking water brands — 1L and 500ml
              bottles — straight to homes and offices. Order directly on WhatsApp — no app to
              download, no waiting on hold.
            </p>
            <div className={styles.heroActions}>
              <a href={whatsappLink('Hi! I want to order water bottles.')} className={styles.ctaButton}>
                Order on WhatsApp
              </a>
              <Link href="/about" className={styles.secondaryButton}>
                Learn more
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroImageFrame}>
              <Image
                src="/images/detox-bottle-transparent.png"
                alt="Packaged drinking water bottle delivered by DRINK iT"
                fill
                className={styles.heroImage}
                priority
                sizes="(min-width: 900px) 460px, 90vw"
              />
            </div>
          </div>
        </div>
      </section>

      <div className={styles.trustStrip}>
        {TRUST_ITEMS.map((item) => (
          <div className={styles.trustItem} key={item.label}>
            <span className={styles.trustIcon}>{item.icon}</span>
            <span className={styles.trustLabel}>{item.label}</span>
          </div>
        ))}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Our Products</span>
          <h2 className={styles.sectionTitle}>Trusted packaged water brands</h2>
          <p className={styles.sectionSubtitle}>
            We don&apos;t make our own water — we deliver quality-checked, sealed bottles from
            brands you already trust. Order any quantity, priced by the box.
          </p>
        </div>
        <div className={styles.productGrid}>
          {BRANDS.map((brand) => {
            const product = PRODUCTS[brand.code];
            return (
              <div className={styles.productCard} key={brand.code}>
                <div className={styles.productImageWrap}>
                  <Image
                    src={brand.image}
                    alt={`${brand.name} packaged drinking water, available for delivery via DRINK iT`}
                    fill
                    className={styles.productImage}
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <div className={styles.productBody}>
                  <h3 className={styles.productName}>{product.label} Bottles</h3>
                  <p className={styles.productMeta}>{product.piecesPerBox} bottles per box</p>
                  <div className={styles.productPriceRow}>
                    <p className={styles.productPrice}>
                      ₹{product.boxPrice} <span className={styles.productPriceUnit}>/ box</span>
                    </p>
                    <span className={styles.productPerBottle}>
                      ₹{formatMoney(unitPrice(brand.code))} / bottle
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>How It Works</span>
          <h2 className={styles.sectionTitle}>Ordering takes three steps</h2>
        </div>
        <div className={styles.stepsGrid}>
          {STEPS.map((step, i) => (
            <div className={styles.stepCard} key={step.title}>
              <div className={styles.stepNumber}>{i + 1}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
