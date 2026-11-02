# FreshCo homepage: Fresh Picks

Selected 2026-11-02. The user's attached `Screenshot 2026-11-02 at 12.22.52 AM.png` supersedes Blue Hour. Visual truth is normalized to the 1613 × 1146 webpage area, excluding screenshot-viewer chrome.

## Locked opening composition

- Full-bleed light-blue `#cceafa` hero, approximately 728px tall at 1613px wide. Original feta/olive bowl and triangular filo pastries on the right, framed by flat cobalt olive/feta and red pasta/leaf illustrations. No rasterized UI, screenshot frame, carousel or dark photographic background.
- Transparent navigation. Original `/logo.png` unchanged. Dark Shop, Stories, About and Contact links; dark outline Search, Account and Bag controls. Mobile menu below 1280px prevents overlap.
- Live headline: “Fresh picks.” / “Big flavours.” Heavy navy geometric sans, approximately 124px, tight tracking and 0.88 line height. Left gutter approximately 74px, top approximately 186px.
- Supporting text: “Your Greek deli favourites, ready for Click & Collect at Northcote Plaza.” Approximately 26px, dark navy, two lines on desktop.
- Blue primary pill “Shop the deli” and dark outline secondary pill “How to collect”; real arrow icons and approximately 66px height.
- Warm near-white collection surface. Heading “A deli for every craving.”, navy, approximately 63px. Four warm photographic tiles, Cheese / Deli / Frozen / Grocery, 3:2 crop, small rounded corners, white labels and round arrow controls.

## Shared system

- Retain FreshCo blue `#2965f1`, red `#ff3038`, ink `#17213a`, original logo and existing Manrope / Bricolage fonts. Add Inter 900 for the selected heavy geometric opening headlines; body and catalogue fonts remain unchanged.
- 64px section gutters at desktop; 20px mobile. Comfortable 17–18px body/UI text, 44px icon targets and scrollable navigation drawer. Navy text and outline icons over light blue.
- Existing catalogue, category mappings, cart, authentication, click-and-collect policy, price-pending safeguards and admin gates remain unchanged.
- Core interactions: collection navigation, search panel and result selection, mobile navigation, account/admin link, cart drawer, primary shop link and collection-info link.
- Motion: a short, reduced-motion-aware entrance; quiet image zoom on collection hover. No forced intro delay, fake loader or hijacked scrolling.
- Request-scoped React caching deduplicates identical layout/home catalogue reads without persistent stale caching.

## Asset inventory

Original generated editorial photographs and illustrations: desktop hero, mobile hero, Cheese, Deli antipasti, Frozen filo, Grocery. No generated product pack shots or altered supplier branding. Each production asset is bundled locally as WebP; generation notes are recorded in `src/data/homepage-assets.json`. Existing supplier-photo rights remain a separate review.

## Intentional product constraints

- The selected Deli mock showed cured meat; the real Deli catalogue is antipasti/dips, with meat under Small Goods. The production Deli photo therefore shows antipasti. All seven workbook collections remain reachable through Shop and the collection index.
- The four primary tiles are featured navigation, not a replacement category taxonomy. Collection counts, slugs, products, prices and publication states are not changed by this redesign.
- Below the specified opening, retain the existing product-card and stories families in the same visual system. Remove redundant promotional/trending/deal sections that implied unsupplied marketing flags, discounts or repeated category promotions.
- On mobile, recompose the same visual with calm light-blue space behind text and food visible below; preserve the exact headline, collection message and actions.
