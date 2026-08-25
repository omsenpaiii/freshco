export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeImageUrls(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return [] as string[]
}

export function normalizeVariants(value: unknown) {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      throw new Error('Variants must be valid JSON.')
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('At least one variant is required.')
  const variants = parsed.map((input) => {
    const item = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
    return {
    ...(Number.isInteger(Number(item.id)) && Number(item.id) > 0 ? { id: Number(item.id) } : {}),
    title: String(item.title || '').trim(),
    sku: String(item.sku || '').trim(),
    weight_grams: item.weight_grams == null || item.weight_grams === '' ? null : Number(item.weight_grams),
    price: Number(item.price),
    inventory_quantity: Number(item.inventory_quantity ?? 0),
    is_default: parsed.length === 1 ? true : Boolean(item.is_default),
    }
  })
  if (variants.some((item) => !item.title || !item.sku || !Number.isFinite(item.price) || item.price < 0 || !Number.isInteger(item.inventory_quantity) || item.inventory_quantity < 0)) {
    throw new Error('Every variant needs a title, SKU, non-negative price and whole-number inventory.')
  }
  if (new Set(variants.map((item) => item.sku)).size !== variants.length) throw new Error('Variant SKUs must be unique.')
  if (variants.filter((item) => item.is_default).length > 1) throw new Error('Only one variant can be the default.')
  return variants
}
