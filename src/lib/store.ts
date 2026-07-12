export interface StoreDetails {
  name: string
  unit: string
  centre: string
  street: string
  suburb: string
  state: string
  postcode: string
  phone: string
  phoneHref: string
  mapsUrl: string
  mapEmbedUrl: string
  hours: ReadonlyArray<{ days: string; hours: string }>
}

export const STORE: StoreDetails = {
  name: 'FreshCo Deli',
  unit: 'Unit GX04',
  centre: 'Northcote Plaza',
  street: '3 Separation St',
  suburb: 'Northcote',
  state: 'VIC',
  postcode: '3070',
  phone: '+61 3 8589 0447',
  phoneHref: 'tel:+61385890447',
  mapsUrl: 'https://maps.app.goo.gl/Tp71ygPiz1kRavcD9?g_st=ic',
  mapEmbedUrl: 'https://www.google.com/maps?q=FreshCo+Deli,+Northcote+Plaza,+3+Separation+St,+Northcote+VIC+3070,+Australia&output=embed',
  hours: [
    { days: 'Monday–Wednesday', hours: '9:00 am–5:30 pm' },
    { days: 'Thursday', hours: '9:00 am–7:00 pm' },
    { days: 'Friday', hours: '9:00 am–8:00 pm' },
    { days: 'Saturday', hours: '9:00 am–5:00 pm' },
    { days: 'Sunday', hours: '10:00 am–5:00 pm' },
  ],
}

export const FREE_DELIVERY_THRESHOLD = 50
export const STANDARD_DELIVERY_FEE = 4.99

const audFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
})

export function formatAUD(value: number | string) {
  return audFormatter.format(Number(value))
}

export function getDeliveryFee(subtotal: number) {
  return subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE
}
