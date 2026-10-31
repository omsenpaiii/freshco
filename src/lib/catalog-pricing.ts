import type { ProductVariant } from '@/lib/catalog-types'

/** Zero is the catalog's explicit “Price pending” value, never a free item. */
export function hasConfirmedPrice(price: number) {
  return Number.isFinite(price) && price > 0
}

export function isVariantPurchasable(variant?: Pick<ProductVariant, 'price' | 'inventory_quantity'> | null) {
  return Boolean(variant && hasConfirmedPrice(variant.price) && variant.inventory_quantity > 0)
}
