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

export function calculateAmount(productCode: ProductCode, quantity: number): number {
  const raw = unitPrice(productCode) * quantity;
  return Math.round(raw * 100) / 100;
}
