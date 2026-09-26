export interface ProductPage {
  slug: string;
  brand: 'Puresy' | 'Detox';
  size: '500ml' | '1L';
  image: string;
  mrp: number;
  sellPrice: number;
}

export const PRODUCT_PAGES: ProductPage[] = [
  {
    slug: 'puresy1l',
    brand: 'Puresy',
    size: '1L',
    image: '/images/puresy-banner-gradient.png',
    mrp: 20,
    sellPrice: 8,
  },
  {
    slug: 'puresy500ml',
    brand: 'Puresy',
    size: '500ml',
    image: '/images/puresy-500ml.png',
    mrp: 10,
    sellPrice: 5,
  },
  {
    slug: 'detox1l',
    brand: 'Detox',
    size: '1L',
    image: '/images/detox-bottle-transparent.png',
    mrp: 20,
    sellPrice: 8,
  },
  {
    slug: 'detox500ml',
    brand: 'Detox',
    size: '500ml',
    image: '/images/detox-500ml.png',
    mrp: 10,
    sellPrice: 5,
  },
];

export function findProductPage(slug: string): ProductPage | undefined {
  return PRODUCT_PAGES.find((p) => p.slug === slug);
}

export function discountPercent(product: ProductPage): number {
  return Math.round(((product.mrp - product.sellPrice) / product.mrp) * 100);
}
