import { ProductCode, PRODUCTS } from './products';
import { PRODUCT_PAGES } from './productPages';

// Derived from PRODUCT_PAGES (the single source of truth for our catalog
// products) - to add or remove a catalog mapping, just set/unset
// catalogRetailerId on the relevant entry there. No separate list to keep in
// sync.
const CATALOG_RETAILER_MAP: Record<string, ProductCode> = Object.fromEntries(
  PRODUCT_PAGES.filter((p) => p.catalogRetailerId).map((p) => [p.catalogRetailerId as string, p.productCode])
);

// Fallback when a retailer_id isn't in the map above (e.g. a catalog item
// was added without updating PRODUCT_PAGES yet) - matches by the item's unit
// price against our per-bottle price, picking the closest product.
function guessProductCodeByPrice(itemPrice: number): ProductCode | null {
  const codes = Object.keys(PRODUCTS) as ProductCode[];
  let best: ProductCode | null = null;
  let bestDiff = Infinity;

  for (const code of codes) {
    const perBottle = PRODUCTS[code].boxPrice / PRODUCTS[code].piecesPerBox;
    const diff = Math.abs(perBottle - itemPrice);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = code;
    }
  }

  // Only trust the guess if it's reasonably close (within ~30%), otherwise
  // treat it as unresolvable rather than silently picking the wrong product.
  if (best && bestDiff <= (PRODUCTS[best].boxPrice / PRODUCTS[best].piecesPerBox) * 0.3) {
    return best;
  }
  return null;
}

export function resolveProductCode(retailerId: string, itemPrice: number): ProductCode | null {
  return CATALOG_RETAILER_MAP[retailerId] || guessProductCodeByPrice(itemPrice);
}
