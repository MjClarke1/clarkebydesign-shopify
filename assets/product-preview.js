// Clarke By Design — product-preview.js (PHASE 2, DEFERRED)
//
// TODO(phase-2): Live SVG preview over the primary product image.
//
// Spec reference: docs/superpowers/specs/2026-05-20-clarkebydesign-shopify-theme-design.md §5.4
//
// Approach when implemented:
//   1. For each product opted into preview (via `product.metafields.preview.template_svg`),
//      load the SVG template into an absolutely-positioned overlay on `.product-gallery__main`.
//   2. Listen for changes on [data-property-name] and [name="properties[Font]"] and on
//      the swatch radios (data-chip-option). On change, mutate the SVG's text node:
//        - fill = active letter colour swatch hex
//        - font-family = the data-font-family attribute of the selected font radio
//        - text content = the name input value
//   3. Throttle on input via requestAnimationFrame.
//   4. If the active variant has no associated template SVG metafield, silently skip.
//
// Open question: vanilla SVG vs. fabric.js — to be decided when phase 2 starts.
// See spec §9 open question #5.
//
// NOTE: This file is intentionally NOT loaded by any layout or section in phase 1.
//       Do not add a script tag for it until phase 2 begins.

export {};
