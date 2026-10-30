import { ProductCode } from './products';

export interface ProductPage {
  slug: string;
  brand: 'Puresy' | 'Detox' | 'Independence' | 'Kinley' | 'Bisleri';
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
    image: '/images/puresy-banner-gradient.webp',
    catalogRetailerId: 'lk63ilai9x',
  },
  {
    slug: 'puresy500ml',
    brand: 'Puresy',
    size: '500ml',
    productCode: '500ML',
    image: '/images/puresy-500ml.webp',
    catalogRetailerId: 'cv0xsqxfuu',
  },
  {
    slug: 'detox1l',
    brand: 'Detox',
    size: '1L',
    productCode: '1L',
    image: '/images/Detox Pure Water Splash - 1L.webp',
    catalogRetailerId: '9vwq63m36r',
  },
  {
    slug: 'detox500ml',
    brand: 'Detox',
    size: '500ml',
    productCode: '500ML',
    image: '/images/detox-bottle-transparent - 500ml.webp',
    catalogRetailerId: 'yn3f58i2da',
  },
  {
    slug: 'indepenence1l',
    brand: 'Independence',
    size: '1L',
    productCode: '1L',
    image: '/images/independece - 1l bottle.jpg',
    catalogRetailerId: 'cizzhwstrq',
  },
  {
    slug: 'kinley1l',
    brand: 'Kinley',
    size: '1L',
    productCode: '1L',
    image: '/images/Kinley - 1L.webp',
    catalogRetailerId: 'kjntepsntc',
  },
  {
    slug: 'bisleri1l',
    brand: 'Bisleri',
    size: '1L',
    productCode: '1L',
    image: '/images/Bisleri - 1L .webp',
    catalogRetailerId: 'syxeewuwf3',
  },
];

export function findProductPage(slug: string): ProductPage | undefined {
  return PRODUCT_PAGES.find((p) => p.slug === slug);
}
