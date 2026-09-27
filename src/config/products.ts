// Flat rate per box - the price per bottle is derived from the box price so
// any quantity (not just whole boxes) can be priced dynamically.
export const PRODUCTS = {
  '1L': {
    code: '1L',
    label: '1 Liter',
    boxPrice: 90,
    piecesPerBox: 12,
  },
  '500ML': {
    code: '500ML',
    label: '500ml',
    boxPrice: 115,
    piecesPerBox: 24,
  },
} as const;

export type ProductCode = keyof typeof PRODUCTS;

export function unitPrice(productCode: ProductCode): number {
  const product = PRODUCTS[productCode];
  return product.boxPrice / product.piecesPerBox;
}

// `quantity` here is the number of BOXES (WhatsApp cart quantities are boxes,
// not individual bottles - a customer orders "2" meaning 2 boxes of 12/24 pieces).
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
// cart entries for '1L' become one item with the summed quantity), since a
// WhatsApp cart can list the same catalog item more than once.
export function mergeItemQuantities(
  entries: Array<{ product: ProductCode; quantity: number }>
): Array<{ product: ProductCode; quantity: number }> {
  const totals = new Map<ProductCode, number>();
  for (const { product, quantity } of entries) {
    totals.set(product, (totals.get(product) || 0) + quantity);
  }
  return Array.from(totals.entries()).map(([product, quantity]) => ({ product, quantity }));
}
