import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './product.module.css';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { env } from '@/config/env';
import { PRODUCT_LIST, findProductBySlug, Product } from '@/config/products';

export function generateStaticParams() {
  return PRODUCT_LIST.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.brand} ${product.size} Packaged Water – ${env.business.name}`,
    description: `Order ${product.brand} ${product.size} packaged drinking water in bulk boxes, delivered via WhatsApp by ${env.business.name}.`,
  };
}

function buildWhatsappLink(product: Product): string {
  const text = `Hi! I want to order ${product.brand} ${product.size} water bottles.`;
  if (!env.business.whatsappNumber) return '/admin';
  return `https://wa.me/${env.business.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

const FEATURES = ['Sealed & tamper-proof', 'Free delivery on bulk orders'];

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) notFound();

  const otherProducts = PRODUCT_LIST.filter((p) => p.slug !== product.slug);

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
              Purified, sealed {product.size} bottles, supplied in bulk boxes of {product.piecesPerBox} —
              ordered on WhatsApp, delivered to your door.
            </p>

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

        <div className={styles.otherProducts}>
          <h2 className={styles.otherProductsTitle}>Other products</h2>
          <div className={styles.otherGrid}>
            {otherProducts.map((p) => (
              <Link href={`/product/${p.slug}`} className={styles.otherCard} key={p.slug}>
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
                  <p className={styles.otherCardMeta}>{p.piecesPerBox} pcs / box</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
