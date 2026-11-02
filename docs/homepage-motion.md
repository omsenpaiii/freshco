# Homepage motion — 2 November 2026

- Reuse the existing Motion dependency: no new animation runtime or scroll hijacking.
- Reveal headings, individual cards, collection tiles and collection-guide steps on entry, with bounded stagger and transform/opacity animation. Server content remains visible without JavaScript.
- Hero artwork and copy move at different scroll rates. The new food section gathers two editorial photographs around a blue/red food emblem with a restrained settling movement.
- Respect reduced-motion preferences: no parallax, assembly, reveal, shimmer or product entrance animation; retain visible content and native navigation.
- Link all remaining populated catalogue categories without inventing categories or changing workbook mappings.
- Reserve at least one screen for product routes, including an immediate product-shaped Suspense skeleton. Keep shared navigation interactive during loading, then fade/translate the product into place without an artificial delay.

## Editorial asset provenance

`public/images/home/food-motion-emblem.webp`: AI-generated transparent illustration, 2 November 2026, using the existing AI-generated FreshCo hero as a style reference. Decorative blue/white feta, red pasta and blue olives; not a product photograph or pack shot. Source image retained in the task's generated-images directory (`exec-bc9d4a4f-d916-4496-bd82-eabe1d3ba03f.png`). No third-party imagery added by this change.

## Verification

- Production build and TypeScript passed.
- Six existing admin/provenance regression tests passed.
- Browser checks at 1440px and 390px: hero, category links, scroll-linked transforms, new section, collection-guide anchor and product navigation. No horizontal overflow; no browser warnings/errors during local checks.
- Product navigation visibly entered the “Loading product” state before showing the loaded product. The loaded page retained its full main-content height and kept the footer below the product.
