import { ProductCode } from './products';

export interface ProductPage {
  slug: string;
  brand: 'Puresy' | 'Detox';
  size: '500ml' | '1L';
  productCode: ProductCode;
  image: string;
  // The catalog item's retailer_id / Content ID from Meta Commerce Manager
  // (Catalog > Items), when this product is listed there. Leave unset for
  // products not yet added to the catalog - the bot falls back to matching
  // by price for anything without a mapped ID.
  catalogRetailerId?: string;
}

export const PRODUCT_PAGES: ProductPage[] = [
  {
    slug: 'puresy1l',
    brand: 'Puresy',
    size: '1L',
    productCode: '1L',
    image: '/images/puresy-banner-gradient.png',
    catalogRetailerId: 'yn3f58i2da',
  },
  {
    slug: 'puresy500ml',
    brand: 'Puresy',
    size: '500ml',
    productCode: '500ML',
    image: '/images/puresy-500ml.png',
    catalogRetailerId: 'cv0xsqxfuu',
  },
  {
    slug: 'detox1l',
    brand: 'Detox',
    size: '1L',
    productCode: '1L',
    image: '/images/detox-bottle-transparent.png',
    catalogRetailerId: 'lk63ilai9x',
  },
  {
    slug: 'detox500ml',
    brand: 'Detox',
    size: '500ml',
    productCode: '500ML',
    image: '/images/detox-500ml.png',
    catalogRetailerId: '9vwq63m36r',
  },
];

export function findProductPage(slug: string): ProductPage | undefined {
  return PRODUCT_PAGES.find((p) => p.slug === slug);
}
