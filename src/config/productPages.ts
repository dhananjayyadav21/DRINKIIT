import { ProductCode } from './products';

export interface ProductPage {
  slug: string;
  brand: 'Puresy' | 'Detox';
  size: '500ml' | '1L';
  productCode: ProductCode;
  image: string;
}

export const PRODUCT_PAGES: ProductPage[] = [
  {
    slug: 'puresy1l',
    brand: 'Puresy',
    size: '1L',
    productCode: '1L',
    image: '/images/puresy-banner-gradient.png',
  },
  {
    slug: 'puresy500ml',
    brand: 'Puresy',
    size: '500ml',
    productCode: '500ML',
    image: '/images/puresy-500ml.png',
  },
  {
    slug: 'detox1l',
    brand: 'Detox',
    size: '1L',
    productCode: '1L',
    image: '/images/detox-bottle-transparent.png',
  },
  {
    slug: 'detox500ml',
    brand: 'Detox',
    size: '500ml',
    productCode: '500ML',
    image: '/images/detox-500ml.png',
  },
];

export function findProductPage(slug: string): ProductPage | undefined {
  return PRODUCT_PAGES.find((p) => p.slug === slug);
}
