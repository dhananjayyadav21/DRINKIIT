// Single source of truth for the product catalog. To add, remove, or edit a
// product - its price, Meta Commerce Manager catalog ID, image, label,
// anything - edit it here and only here. There is no second file to keep in
// sync. (This file is about catalog/pricing facts only - order status, cart
// state, and message copy live elsewhere.)
//
// Pricing is per BRAND+SIZE, not just size - each brand has its own box
// price (confirmed from Meta Commerce Manager), so two products can't share
// a code even if they're nominally the same size.
export type ProductCode =
  | 'PURESY_1L'
  | 'PURESY_500ML'
  | 'DETOX_1L'
  | 'DETOX_500ML'
  | 'INDEPENDENCE_1_5L'
  | 'BISLERI_1L'
  | 'KINLEY_1L';

export interface Product {
  code: ProductCode;
  brand: 'Puresy' | 'Detox' | 'Independence' | 'Kinley' | 'Bisleri';
  size: '500ml' | '1L' | '1.5L';
  label: string;
  boxPrice: number;
  piecesPerBox: number;
  // Route slug for this product's detail page (/product/<slug>).
  slug: string;
  image: string;
  // The catalog item's retailer_id / Content ID from Meta Commerce Manager
  // (Catalog > Items), when this product is listed there. Leave unset for
  // products not yet added to the catalog - the bot falls back to matching
  // by price for anything without a mapped ID.
  catalogRetailerId?: string;
}

// Ordered list - iterate this for the WhatsApp catalog message, the
// homepage/product grid, and anywhere else display order matters.
export const PRODUCT_LIST: Product[] = [
  {
    code: 'PURESY_1L',
    brand: 'Puresy',
    size: '1L',
    label: 'Puresy 1 Litre',
    boxPrice: 90,
    piecesPerBox: 12,
    slug: 'puresy1l',
    image: '/images/puresy-banner-gradient.webp',
    catalogRetailerId: 'lk63ilai9x',
  },
  {
    code: 'PURESY_500ML',
    brand: 'Puresy',
    size: '500ml',
    label: 'Puresy 500ml',
    boxPrice: 115,
    piecesPerBox: 24,
    slug: 'puresy500ml',
    image: '/images/puresy-500ml.webp',
    catalogRetailerId: 'cv0xsqxfuu',
  },
  {
    code: 'DETOX_1L',
    brand: 'Detox',
    size: '1L',
    label: 'Detox 1 Litre',
    boxPrice: 90,
    piecesPerBox: 12,
    slug: 'detox1l',
    image: '/images/Detox Pure Water Splash - 1L.webp',
    catalogRetailerId: '9vwq63m36r',
  },
  {
    code: 'DETOX_500ML',
    brand: 'Detox',
    size: '500ml',
    label: 'Detox 500ml',
    boxPrice: 115,
    piecesPerBox: 24,
    slug: 'detox500ml',
    image: '/images/detox-bottle-transparent - 500ml.webp',
    catalogRetailerId: 'yn3f58i2da',
  },
  {
    code: 'INDEPENDENCE_1_5L',
    brand: 'Independence',
    size: '1.5L',
    label: 'Independence 1.5 Litre',
    boxPrice: 160,
    piecesPerBox: 15,
    slug: 'indepenence1l',
    image: '/images/independece - 1l bottle.jpg',
    catalogRetailerId: 'cizzhwstrq',
  },
  {
    code: 'BISLERI_1L',
    brand: 'Bisleri',
    size: '1L',
    label: 'Bisleri 1 Litre',
    boxPrice: 150,
    piecesPerBox: 12,
    slug: 'bisleri1l',
    image: '/images/Bisleri - 1L .webp',
    catalogRetailerId: 'syxeewuwf3',
  },
  {
    code: 'KINLEY_1L',
    brand: 'Kinley',
    size: '1L',
    label: 'Kinley 1 Litre',
    boxPrice: 190,
    piecesPerBox: 12,
    slug: 'kinley1l',
    image: '/images/Kinley - 1L.webp',
    catalogRetailerId: 'kjntepsntc',
  },
];

// Keyed lookup - use PRODUCTS[code] wherever a single product needs to be
// resolved from a stored ProductCode (order items, cart matching, etc).
export const PRODUCTS: Record<ProductCode, Product> = Object.fromEntries(
  PRODUCT_LIST.map((p) => [p.code, p])
) as Record<ProductCode, Product>;

export function findProductBySlug(slug: string): Product | undefined {
  return PRODUCT_LIST.find((p) => p.slug === slug);
}

export function unitPrice(productCode: ProductCode): number {
  const product = PRODUCTS[productCode];
  return product.boxPrice / product.piecesPerBox;
}

// `quantity` here is the number of BOXES (WhatsApp cart quantities are boxes,
// not individual bottles - a customer orders "2" meaning 2 boxes of
// however many pieces that product's box holds).
export function calculateAmount(productCode: ProductCode, quantity: number): number {
  const raw = PRODUCTS[productCode].boxPrice * quantity;
  return Math.round(raw * 100) / 100;
}

export const BOX_TIERS = [1, 2, 3, 5, 10, 15, 30, 40, 50] as const;

export interface BoxTierRow {
  boxes: number;
  pieces: number;
  price: number;
}

export function boxTierTable(productCode: ProductCode): BoxTierRow[] {
  const product = PRODUCTS[productCode];
  return BOX_TIERS.map((boxes) => ({
    boxes,
    pieces: boxes * product.piecesPerBox,
    price: boxes * product.boxPrice,
  }));
}

// Combines quantities of the same product code into a single line (e.g. two
// cart entries for the same SKU become one item with the summed quantity),
// since a WhatsApp cart can list the same catalog item more than once.
export function mergeItemQuantities(
  entries: Array<{ product: ProductCode; quantity: number }>
): Array<{ product: ProductCode; quantity: number }> {
  const totals = new Map<ProductCode, number>();
  for (const { product, quantity } of entries) {
    totals.set(product, (totals.get(product) || 0) + quantity);
  }
  return Array.from(totals.entries()).map(([product, quantity]) => ({ product, quantity }));
}
