import { ProductCode, PRODUCTS, PRODUCT_LIST } from './products';

// Derived from PRODUCT_LIST (the single source of truth for our catalog
// products) - to add or remove a catalog mapping, just set/unset
// catalogRetailerId on the relevant entry there. No separate list to keep in
// sync.
const CATALOG_RETAILER_MAP: Record<string, ProductCode> = Object.fromEntries(
  PRODUCT_LIST.filter((p) => p.catalogRetailerId).map((p) => [p.catalogRetailerId as string, p.code])
);

// Fallback when a retailer_id isn't in the map above (e.g. a catalog item
// was added without updating PRODUCT_LIST yet) - matches by the item's unit
// price against our per-bottle price, picking the closest product.
//
// Now that pricing is per brand+size rather than per size, multiple SKUs can
// share the same per-bottle price (e.g. Puresy 1L and Detox 1L are both
// ₹7.50/bottle) - this guess can't distinguish between them and will pick
// whichever matching code iterates first, arbitrarily. That's only a real
// risk if a catalog item's retailer_id is missing from CATALOG_RETAILER_MAP
// above; every current SKU in PRODUCT_LIST has one mapped, so this path
// should rarely trigger in practice. Keep catalogRetailerId set for any new
// SKU added at the same price point as an existing one.
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
