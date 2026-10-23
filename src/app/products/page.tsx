import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../home.module.css';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { env } from '@/config/env';
import { PRODUCT_PAGES } from '@/config/productPages';

export const metadata: Metadata = {
  title: `Products – ${env.business.name}`,
};

export default function ProductsPage() {
  return (
    <div className={styles.page}>
      <SiteNav />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Our Products</span>
          <h2 className={styles.sectionTitle}>Shop by brand</h2>
          <p className={styles.sectionSubtitle}>
            We don&apos;t make our own water — we deliver quality-checked, sealed bottles from
            brands you already trust.
          </p>
        </div>
        <div className={styles.productGrid}>
          {PRODUCT_PAGES.map((page) => (
            <Link href={`/product/${page.slug}`} className={styles.productCard} key={page.slug}>
              <div className={styles.productImageWrap}>
                <Image
                  src={page.image}
                  alt={`${page.brand} ${page.size} packaged drinking water, available for delivery via DRINK IT`}
                  fill
                  className={styles.productImage}
                  sizes="(min-width: 640px) 50vw, 100vw"
                />
              </div>
              <div className={styles.productBody}>
                <h3 className={styles.productName}>
                  {page.brand} {page.size}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
