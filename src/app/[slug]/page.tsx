import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './product.module.css';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { env } from '@/config/env';
import { PRODUCTS, boxTierTable } from '@/config/products';
import { PRODUCT_PAGES, findProductPage, ProductPage } from '@/config/productPages';

export function generateStaticParams() {
  return PRODUCT_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductPage(slug);
  if (!product) return {};

  const box = PRODUCTS[product.productCode];
  return {
    title: `${product.brand} ${product.size} Packaged Water – ${env.business.name}`,
    description: `Order ${product.brand} ${product.size} packaged drinking water in bulk boxes, starting at ₹${box.boxPrice} per box (${box.piecesPerBox} pcs), delivered via WhatsApp by ${env.business.name}.`,
  };
}

function buildWhatsappLink(product: ProductPage): string {
  const text = `Hi! I want to order ${product.brand} ${product.size} water bottles.`;
  if (!env.business.whatsappNumber) return '/admin';
  return `https://wa.me/${env.business.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

const FEATURES = ['Sealed & tamper-proof', 'Free delivery on bulk orders'];

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProductPage(slug);
  if (!product) notFound();

  const box = PRODUCTS[product.productCode];
  const tiers = boxTierTable(product.productCode);
  const otherProducts = PRODUCT_PAGES.filter((p) => p.slug !== product.slug);

  return (
    <div className={styles.page}>
      <SiteNav />

      <div className={styles.section}>
        <p className={styles.breadcrumb}>
          <Link href="/">Home</Link> / {product.brand} {product.size}
        </p>

        <div className={styles.layout}>
          <div className={styles.imageFrame}>
            <Image
              src={product.image}
              alt={`${product.brand} ${product.size} packaged drinking water bottle`}
              fill
              className={styles.image}
              priority
              sizes="(min-width: 860px) 500px, 90vw"
            />
          </div>

          <div>
            <span className={styles.brandBadge}>{product.brand}</span>
            <h1 className={styles.title}>
              {product.brand} {product.size} Packaged Water
            </h1>
            <p className={styles.subtitle}>
              Purified, sealed {product.size} bottles, supplied in bulk boxes of {box.piecesPerBox} —
              ordered on WhatsApp, delivered to your door.
            </p>

            <div className={styles.priceRow}>
              <span className={styles.sellPrice}>₹{box.boxPrice}</span>
              <span className={styles.taxNote}>/ box ({box.piecesPerBox} pcs)</span>
            </div>

            <ul className={styles.features}>
              {FEATURES.map((feature) => (
                <li key={feature}>
                  <svg viewBox="0 0 20 20" className={styles.checkIcon} fill="none" aria-hidden="true">
                    <path
                      d="M4 10.5l4 4 8-9"
                      stroke="#0f6e94"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className={styles.actions}>
              <a href={buildWhatsappLink(product)} className={styles.ctaButton}>
                Order on WhatsApp
              </a>
              <Link href="/" className={styles.secondaryButton}>
                View all products
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.pricingTable}>
          <h2 className={styles.pricingTitle}>Bulk Pricing</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Boxes</th>
                  <th>Pieces</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((row) => (
                  <tr key={row.boxes}>
                    <td>
                      {row.boxes} Box{row.boxes > 1 ? 'es' : ''}
                    </td>
                    <td>{row.pieces} pcs</td>
                    <td>₹{row.price.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.otherProducts}>
          <h2 className={styles.otherProductsTitle}>Other products</h2>
          <div className={styles.otherGrid}>
            {otherProducts.map((p) => {
              const otherBox = PRODUCTS[p.productCode];
              return (
                <Link href={`/${p.slug}`} className={styles.otherCard} key={p.slug}>
                  <div className={styles.otherImageWrap}>
                    <Image
                      src={p.image}
                      alt={`${p.brand} ${p.size} packaged drinking water bottle`}
                      fill
                      className={styles.otherImage}
                      sizes="(min-width: 640px) 33vw, 50vw"
                    />
                  </div>
                  <div className={styles.otherCardBody}>
                    <p className={styles.otherCardName}>
                      {p.brand} {p.size}
                    </p>
                    <p className={styles.otherCardMeta}>{otherBox.piecesPerBox} pcs / box</p>
                    <span className={styles.otherCardPrice}>₹{otherBox.boxPrice} / box</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
