import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const slugify = (value) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const pack = (value) => value.replace(/\s+/g, '').toUpperCase()

const categories = [
  { id: 1, name: 'Cheese', slug: 'cheese', description: 'Greek feta and speciality cheeses.', image_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=85&w=1600&auto=format&fit=crop', image_source_url: 'https://unsplash.com/photos/8manzosDSGM', image_license: 'Unsplash License' },
  { id: 2, name: 'Frozen', slug: 'frozen', description: 'Filosophy Greek filo pies and pastries.', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=85&w=1600&auto=format&fit=crop', image_source_url: 'https://unsplash.com/photos/52jRtc2S_VE', image_license: 'Unsplash License' },
  { id: 3, name: 'Grocery', slug: 'grocery', description: 'Misko pasta shapes for the pantry.', image_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=85&w=1600&auto=format&fit=crop', image_source_url: 'https://unsplash.com/photos/xfngap_DToE', image_license: 'Unsplash License' },
  { id: 4, name: 'Deli', slug: 'deli', description: 'Olives, dips and deli-counter favourites.', image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=85&w=1600&auto=format&fit=crop', image_source_url: 'https://unsplash.com/photos/IGfIGP5ONV0', image_license: 'Unsplash License' },
  { id: 5, name: 'Small Goods', slug: 'small-goods', description: 'Ham, salami and traditional small goods.', image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=85&w=1600&auto=format&fit=crop', image_source_url: 'https://unsplash.com/photos/auIbTAcSH6E', image_license: 'Unsplash License' },
]

const dodoniOfficial = 'https://au.dodoni.com/our-products/'
const ionikiOfficial = 'https://www.ioniki.com/en/filosophy'
const miskoDistributor = 'https://www.alfega.co.za/misko-pasta'
const ionikiImage = (file, date, token) => `https://www.ioniki.com/sites/default/files/styles/600px/public/${date}/${file}?itok=${token}`
const sq = (key, file) => `https://images.squarespace-cdn.com/content/v1/52b1e5c6e4b022eff54193e6/${key}/${file}?format=1000w`

const sourceRows = [
  ['Dodoni Kefalograviera', 45.99, 'KG', '250g, 500g, 700g, 1kg', 'Dodoni', 'Cheese', 'Hard Cheese', 'Kefalograviera', 'A firm Greek table cheese with a full, savoury character.', 'https://www.alfega.co.za/dairy', 'https://images.squarespace-cdn.com/content/v1/52b1e5c6e4b022eff54193e6/1510575863321-VOXTC4OH3QCP460RJDDD/kefalograviera-dodoni-250g.jpg?format=1000w', true],
  ['Dodoni Feta Tub 1kg', 34.99, 'EA', '1kg', 'Dodoni', 'Cheese', 'Feta', 'Cow & Sheep Feta', 'Dodoni feta in a resealable 1 kg tub.', 'https://authenticflavourco.com.au/products/dodoni-feta-1kg', 'https://cdn.shopify.com/s/files/1/0619/8876/5854/products/DodoniFeta1kg2.webp?v=1658211619', true],
  ['Dodoni Feta Tub 400g', 17.99, 'EA', '400g', 'Dodoni', 'Cheese', 'Feta', 'Cow & Sheep Feta', 'Dodoni feta in a convenient 400 g tub.', 'https://www.coles.com.au/brands/dodoni-18513903', '', false, 'Exact current 400 g pack image requires approval.'],
  ['Dodoni Goat Feta Tub 400g', 17.99, 'EA', '400g', 'Dodoni', 'Cheese', 'Feta', 'Goat Feta', 'Dodoni goat feta in a 400 g tub.', dodoniOfficial, '', false, 'No verified exact 400 g pack shot found.'],
  ['Dodoni Saganaki', 12.99, 'EA', '200g', 'Dodoni', 'Cheese', 'Hard Cheese', 'Saganaki', 'A 200 g portion of Dodoni cheese made for pan-frying as saganaki.', 'https://authenticflavourco.com.au/products/dodoni-greek-saganaki-cheese-200g', 'https://cdn.shopify.com/s/files/1/0619/8876/5854/products/DodoniSaganakiCheese_720x_5a3ff681-74d9-4d67-b5ac-8ee933ab526d.webp?v=1658732203', true],
  ['Dodoni Halloumi', 7.99, 'EA', '200g', 'Dodoni', 'Cheese', 'Hard Cheese', 'Halloumi', 'Dodoni halloumi supplied as one packaged unit.', 'https://au.dodoni.com/our-products/halloumi/', '', false, 'Current Australian pack is 225 g; supplied item is 200 g.'],
  ['Dodoni Manouri', 7.99, 'EA', '200g', 'Dodoni', 'Cheese', 'Hard Cheese', 'Manouri', 'A soft, creamy 200 g portion of Dodoni Manouri.', 'https://www.basfoods.com.au/products/dodoni-manouri-200g', 'https://cdn.shopify.com/s/files/1/0595/2490/7170/files/dodoni-manouri-200g-pickup-only-35672320934050.png?v=1709363718', true],
  ['Dodoni Feta', 5.99, 'EA', '150g', 'Dodoni', 'Cheese', 'Feta', 'Cow & Sheep Feta', 'A compact 150 g pack of Dodoni feta.', 'https://www.coles.com.au/brands/dodoni-18513903', '', false, 'Exact 150 g pack image requires approval.'],
  ['Dodoni Goat Feta', 5.99, 'EA', '200g', 'Dodoni', 'Cheese', 'Feta', 'Goat Feta', 'A 200 g pack of Dodoni goat feta.', 'https://www.coles.com.au/brands/dodoni-18513903', '', false, 'Exact 200 g pack image requires approval.'],
  ['Dodoni Barrel-Aged Feta', 5.99, 'EA', '150g', 'Dodoni', 'Cheese', 'Feta', 'Barrel-Aged Feta', 'Barrel-aged Dodoni feta in a 150 g pack.', 'https://adelaidesfinest.com.au/product/444818/dodoni-barrel-aged-feta-150g', 'https://www.bananablue.com.au/images/product/5201168815238_1.jpg', true],

  ['Filosophy Feta Spiral Pie', 11.99, 'EA', '850g', 'Filosophy', 'Frozen', 'Pies', 'Spiral Pies', 'A large spiral of crisp filo pastry filled with feta.', `${ionikiOfficial}/Greek-spiral-pie`, ionikiImage('00-22-01.jpg','2022-08','RzNFax79'), true],
  ['Filosophy Spinach & Feta Spiral Pie', 11.99, 'EA', '850g', 'Filosophy', 'Frozen', 'Pies', 'Spiral Pies', 'A large filo spiral filled with spinach and feta.', `${ionikiOfficial}/Greek-spirals-pie`, ionikiImage('00-22-08.jpg','2024-12','_OC3LQ3Q'), true],
  ['Filosophy Spinach Spiral Pie', 11.99, 'EA', '850g', 'Filosophy', 'Frozen', 'Pies', 'Spiral Pies', 'A large filo spiral with a spinach filling.', ionikiOfficial, ionikiImage('00-22-02.jpg','2022-08','QbLMO-v1'), true],
  ['Filosophy Wild Greens Family Pie', 12.99, 'EA', '850g', 'Filosophy', 'Frozen', 'Pies', 'Family Pies', 'A family-size filo pie filled with wild greens.', ionikiOfficial, ionikiImage('00-22-18.jpg','2024-12','oqKbFk5d'), true],
  ['Filosophy Mini Spinach & Feta Spirals', 7.99, 'EA', '450g', 'Filosophy', 'Frozen', 'Pies', 'Mini Pies', 'Mini filo spirals with spinach and feta.', ionikiOfficial, ionikiImage('00-22-38.png','2021-01','RzNqHnLj'), true],
  ['Filosophy Mini Feta Rolls', 8.99, 'EA', '450g', 'Filosophy', 'Frozen', 'Pies', 'Mini Pies', 'Mini filo rolls filled with feta.', ionikiOfficial, ionikiImage('00-22-36.jpg','2024-12','6til1wEG'), true],
  ['Filosophy Mini Cypriot Halloumi Spirals', 9.99, 'EA', '450g', 'Filosophy', 'Frozen', 'Pies', 'Mini Pies', 'Mini filo spirals with Cypriot halloumi.', ionikiOfficial, ionikiImage('00-22-46.jpg','2024-12','qYvmuaUf'), true],
  ['Filosophy Mini Spinach & Feta Triangles', 8.99, 'EA', '500g', 'Filosophy', 'Frozen', 'Pies', 'Mini Pies', 'Mini filo triangles filled with spinach and feta.', ionikiOfficial, ionikiImage('00-22-13.jpg','2024-12','LYhClghc'), true],
  ['Filosophy Mini Spinach & Feta Spirals', 14.99, 'EA', '1kg', 'Filosophy', 'Frozen', 'Pies', 'Mini Pies', 'A 1 kg pack of mini spinach and feta filo spirals.', ionikiOfficial, ionikiImage('00-22-63.jpg','2024-12','JT-VxvdY'), true],
  ['Filosophy Mini Feta Spirals', 15.99, 'EA', '1kg', 'Filosophy', 'Frozen', 'Pies', 'Mini Pies', 'A 1 kg pack of mini feta filo spirals.', ionikiOfficial, ionikiImage('00-22-64.jpg','2024-12','APjhQw42'), true],
  ['Filosophy Leek & Feta Filo Pie', 8.99, 'EA', '550g', 'Filosophy', 'Frozen', 'Pies', 'Family Pies', 'A filo pie filled with leek and feta.', ionikiOfficial, ionikiImage('00-22-35.jpg','2024-12','xoIhlr8k'), true],
  ['Filosophy Feta Filo Pie', 9.99, 'EA', '550g', 'Filosophy', 'Frozen', 'Pies', 'Family Pies', 'A classic feta-filled filo pie.', ionikiOfficial, ionikiImage('00-22-43.jpg','2024-12','DfYNx7hJ'), true],
  ['Filosophy Spinach & Feta Filo Pie', 9.99, 'EA', '550g', 'Filosophy', 'Frozen', 'Pies', 'Family Pies', 'A filo pie with spinach and feta.', ionikiOfficial, ionikiImage('00-22-44.jpg','2024-12','s9e6gCJY'), true],
  ['Filosophy Bougatsa Custard Pie', 9.99, 'EA', '500g', 'Filosophy', 'Frozen', 'Pies', 'Sweet Pies', 'A Greek-style filo pie with a custard filling.', ionikiOfficial, ionikiImage('00-22-03.jpg','2024-12','62ukCwNB'), true],
  ['Filosophy Apple & Cinnamon Spiral', 13.99, 'EA', '850g', 'Filosophy', 'Frozen', 'Pies', 'Sweet Pies', 'A sweet apple and cinnamon filo spiral.', ionikiOfficial, '', false, 'Manufacturer currently lists 840 g; supplied item is 850 g.'],

  ['Misko Macaroni No. 2', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Macaroni', 'Thick tubular pasta traditionally used for pastitsio.', miskoDistributor, sq('1392323929171-84C6OA873BJGB2J2CM52','misko+pastitsio-no.2.jpg'), true],
  ['Misko Macaroni No. 5', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Macaroni', 'Long hollow macaroni in a 500 g pack.', miskoDistributor, sq('1392324210844-B6A2RMWU1WDCL6VRLIT0','misko+macaroni-no5.jpg'), true],
  ['Misko Spaghetti No. 6', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Spaghetti', 'Classic Misko spaghetti in a 500 g pack.', miskoDistributor, sq('1392322372040-YNCLGVVSF633QRKSPZA1','misko+spaghetti+no.6'), true],
  ['Misko Spaghetti No. 10', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Spaghetti', 'Fine Misko spaghetti in a 500 g pack.', miskoDistributor, sq('1392322854402-4WGJ5YEHXPJP1AMEHL4W','misko+spaghetti-no10'), true],
  ['Misko Fides Noodles No. 13', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Soup Pasta', 'Fine noodle pasta supplied in a 500 g pack.', miskoDistributor, '', false, 'Available distributor image is a 250 g pack, not 500 g.'],
  ['Misko Couscous No. 22', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Soup Pasta', 'Small round pasta traditionally used in Greek cooking.', miskoDistributor, sq('1392581261604-M0R9J6FE73VDWPMGUBRA','misko+couscousaki.jpg'), true],
  ['Misko Stars No. 23', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Soup Pasta', 'Small star-shaped pasta in a 500 g pack.', miskoDistributor, '', false, 'No verified exact 500 g pack shot found.'],
  ['Misko Kritharaki Hondro No. 51', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Kritharaki', 'Large rice-shaped pasta suited to oven dishes.', miskoDistributor, sq('1392581286525-J28RVV1C89SPCXSI3FVV','misko+risoni-large.jpg'), true],
  ['Misko Kritharaki Metrio No. 52', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Kritharaki', 'Medium rice-shaped pasta for traditional Greek recipes.', miskoDistributor, sq('1392581289846-CRY8HFBR7PB2XRSKO51M','misko+risoni-medium.jpg'), true],
  ['Misko Tubetti (Kofto) No. 55', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Short Pasta', 'Short-cut tubular pasta in a 500 g pack.', miskoDistributor, sq('1392334353572-OBBRIZT3ULEWTOGOBQDC','misko+tubetti.jpg'), true],
  ['Misko Shells (Saligari) No. 66', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Short Pasta', 'Shell-shaped pasta designed to hold sauce.', miskoDistributor, sq('1392333766173-FS2SLFLQZ1HY1EUW1P8T','misko+shells.jpg'), true],
  ['Misko Twirls (Trivelle) No. 77', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Short Pasta', 'Spring-shaped short pasta in a 500 g pack.', miskoDistributor, sq('1392334395306-BWOJF4FZPFUOHWWVVPXS','misko+twirls.jpg'), true],
  ['Misko Pennaki No. 81', 3.99, 'EA', '500g', 'Misko', 'Grocery', 'Pasta', 'Short Pasta', 'Short penne pasta in a 500 g pack.', miskoDistributor, sq('1392334360887-L7CXPYAZO880A9TT1L3T','misko+penne.jpg'), true],
]

const categoryId = Object.fromEntries(categories.map((c) => [c.name, c.id]))
const parseGrams = (label) => {
  const match = String(label).match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|gr)\b/i)
  if (!match) return null
  return Math.round(Number(match[1]) * (match[2].toLowerCase() === 'kg' ? 1000 : 1))
}

const originalProducts = sourceRows.map((row, index) => {
  const [name, price, unit, variantLabel, brand, category, subcategory_1, subcategory_2, description, product_source_url, image_source_url, verified, draft_reason = null] = row
  const id = index + 1
  const slug = slugify(`${name}-${variantLabel}`)
  const labels = name === 'Dodoni Kefalograviera' ? ['250g', '500g', '700g', '1kg'] : [variantLabel]
  const variantPrices = name === 'Dodoni Kefalograviera' ? [11.50, 23.00, 32.19, 45.99] : [price]
  const variants = labels.map((title, variantIndex) => ({
    id: id * 10 + variantIndex + 1,
    product_id: id,
    title,
    sku: `${brand.slice(0, 3).toUpperCase()}-${slugify(name.replace(brand, '')).split('-').map((part) => part.slice(0, 4)).join('-').toUpperCase()}-${pack(title)}`,
    weight_grams: parseGrams(title),
    price: variantPrices[variantIndex],
    inventory_quantity: 100,
    is_default: labels.length === 1,
  }))
  return {
    id, name, slug, description, price: variants[0].price, compare_at_price: null,
    sku: variants[0].sku, inventory_quantity: 100, images: image_source_url ? [image_source_url] : [],
    category_id: categoryId[category], brand, unit, subcategory_1, subcategory_2,
    status: verified ? 'published' : 'draft', image_match_status: verified ? 'verified' : 'unverified',
    product_source_url, image_source_url: image_source_url || null, draft_reason,
    is_featured: false, is_trending: false, variants,
    categories: { name: category, slug: slugify(category) },
  }
})

const greenRows = JSON.parse(await fs.readFile(path.join(root, 'src/data/green-catalog-rows.json'), 'utf8'))
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()
const normalizeName = (value) => clean(value)
  .replace(/\bAITTIKI\b/gi, 'ATTIKI')
  .replace(/\bChocoloate\b/gi, 'Chocolate')
  .replace(/\bSphagetti\b/gi, 'Spaghetti')
  .replace(/\bAustralan\b/gi, 'Australian')
  .replace(/\bMarniated\b/gi, 'Marinated')
  .replace(/\bAvacado\b/gi, 'Avocado')
  .replace(/\bPortugese\b/gi, 'Portuguese')
  .replace(/\bTapanede\b/gi, 'Tapenade')
  .replace(/\bHommus\b/gi, 'Hummus')
  .replace(/\bFetta\b/gi, 'Feta')

const inferPackLabel = (name, unit) => {
  const matches = [...name.matchAll(/\b\d+(?:\.\d+)?\s*(?:kg|g|gm|gr|ml|lt|l)\b/gi)]
  if (matches.length) return pack(matches.at(-1)[0]).replace(/GM$|GR$/, 'G')
  return unit === 'KG' ? '1KG' : 'EACH'
}

const additionalProducts = greenRows.map(({ row, values }) => {
  const [rawName, rawPrice, rawUnit, rawOptions, rawBrand, rawCategory, rawSubcategory1, rawSubcategory2] = values
  const name = normalizeName(rawName)
  const price = Number.isFinite(rawPrice) ? Number(rawPrice) : 0
  const unit = clean(rawUnit || 'EA').toUpperCase()
  const brand = clean(rawBrand)
  const category = clean(rawCategory)
  const subcategory_1 = clean(rawSubcategory1)
  const subcategory_2 = clean(rawSubcategory2) && clean(rawSubcategory2).toUpperCase() !== 'NA' ? clean(rawSubcategory2) : ''
  const packLabel = inferPackLabel(name, unit)
  const optionLabels = clean(rawOptions) ? clean(rawOptions).split('/').map(clean).filter(Boolean) : [null]
  const id = 1000 + Number(row)
  const slug = slugify(`${name}-${packLabel}-${row}`)
  const brandForSku = brand || name.split(' ')[0] || 'FreshCo'
  const productToken = slugify(name.replace(new RegExp(`^${brandForSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), ''))
    .split('-').filter(Boolean).slice(0, 5).map((part) => part.slice(0, 4)).join('-').toUpperCase() || 'ITEM'
  const variants = optionLabels.map((option, variantIndex) => {
    const title = option ? `${option} · ${packLabel === 'EACH' ? 'Each' : packLabel.toLowerCase()}` : packLabel === 'EACH' ? 'Each' : packLabel.toLowerCase()
    return {
      id: id * 10 + variantIndex + 1,
      product_id: id,
      title,
      sku: `${brandForSku.slice(0, 4).toUpperCase()}-${productToken}-${option ? slugify(option).slice(0, 5).toUpperCase() + '-' : ''}${packLabel}-R${row}`,
      weight_grams: parseGrams(packLabel),
      price,
      inventory_quantity: rawPrice == null ? 0 : 100,
      is_default: optionLabels.length === 1,
    }
  })
  const issues = ['Awaiting an exact, verified pack shot and product source.']
  if (rawPrice == null) issues.push('Price is missing from the workbook.')
  if (unit === 'EA' && packLabel === 'EACH') issues.push('Pack size is not supplied in the workbook.')
  const saleFormat = unit === 'KG' ? 'priced per kilogram' : packLabel === 'EACH' ? 'sold as one packaged unit' : `supplied in a ${packLabel.toLowerCase()} pack`
  return {
    id, name, slug,
    description: `${brand ? `${brand} ` : ''}${subcategory_2 || subcategory_1 || category} ${saleFormat}.`,
    price: variants[0].price, compare_at_price: null, sku: variants[0].sku,
    inventory_quantity: variants.reduce((sum, variant) => sum + variant.inventory_quantity, 0), images: [],
    category_id: categoryId[category], brand, unit, subcategory_1, subcategory_2,
    status: 'draft', image_match_status: 'unverified',
    product_source_url: null, image_source_url: null, draft_reason: issues.join(' '),
    is_featured: false, is_trending: false, variants,
    categories: { name: category, slug: slugify(category) },
    workbook_row: row,
  }
})

const products = [...originalProducts, ...additionalProducts]

const manifest = { version: 2, generated_at: new Date().toISOString(), source_workbook: '/Users/omtomar/Downloads/ITEMS (1).xlsx', categories, products }
const published = products.filter((product) => product.status === 'published')
const categoryFallback = categories.map((category) => ({
  ...category,
  product_count: published.filter((product) => product.category_id === category.id).length,
}))

await fs.mkdir(path.join(root, 'src/data'), { recursive: true })
await fs.writeFile(path.join(root, 'src/data/catalog-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await fs.writeFile(path.join(root, 'src/data/products.json'), `${JSON.stringify(published, null, 2)}\n`)
await fs.writeFile(path.join(root, 'src/data/categories.json'), `${JSON.stringify(categoryFallback, null, 2)}\n`)

const skuCount = products.reduce((total, product) => total + product.variants.length, 0)
if (products.length !== 260 || skuCount !== 275) throw new Error(`Expected 260 products/275 SKUs, got ${products.length}/${skuCount}`)
if (new Set(products.map((p) => p.slug)).size !== products.length) throw new Error('Duplicate product slugs')
const skus = products.flatMap((p) => p.variants.map((v) => v.sku))
if (new Set(skus).size !== skus.length) throw new Error('Duplicate SKUs')
if (products.some((p) => p.variants.some((v) => v.inventory_quantity !== (v.price > 0 ? 100 : 0)))) throw new Error('Invalid inventory seed')

console.log(`Catalog generated: ${products.length} products, ${skuCount} SKUs, ${published.length} published, ${products.length - published.length} drafts.`)
