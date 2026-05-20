# Clarke By Design — Shopify Theme Design

**Date:** 2026-05-20
**Status:** Approved (brainstorm) — pending implementation plan
**Owner:** Marielle Clarke (clarkebydesign@gmail.com)
**Repo:** https://github.com/MjClarke1/clarkebydesign-shopify

---

## 1. Purpose

Build a Shopify storefront theme for Clarke By Design — a small-batch maker of personalized laser-cut and 3D-printed gifts based in Ontario, Canada. The theme will operate as a **parallel storefront** alongside the existing Etsy shop (`Clarkebydesign3D`) — same product catalog, plus surfaces Etsy can't easily serve (custom commissions, local pickup, owned email list, branded storytelling).

### 1.1 Success criteria

- Visually distinct from a default Shopify theme; reads as a curated, gift-shop-premium brand.
- Heavy product personalization (name + colours + font + add-ons) is intuitive and feels tactile, not form-y.
- New seasonal collections and markets can be added by the owner via the Shopify admin (no code changes).
- Mobile Lighthouse performance score ≥ 85.
- Structure supports adding French (Quebec/francophone) translations in phase 2 with no theme rebuild.

### 1.2 Out of scope (phase 1)

- French (fr-CA) translated content. Theme is *structured* for it; content is English-only at launch.
- Live SVG/canvas personalization preview on product pages. Designed-for as a phase-2 upgrade on bestsellers.
- B2B / wholesale portal, tiered pricing, quote-based ordering.
- Custom checkout (Shopify standard checkout, lightly branded).
- Mobile app / headless / Hydrogen.
- Subscription products.

---

## 2. Brand foundation

### 2.1 Existing assets

- **Logo**: black stylized 3D-printer mark + navy `CLARKE` sans wordmark + black `BY DESIGN` high-contrast serif tagline. Provided as PNG; will need an SVG version sourced from the owner for crisp scaling.
- **Voice**: warm, personal, family-focused, handmade. Owner often refers to first names ("for Lucas", "Mrs. Clarke"). Avoid corporate or industrial language.

### 2.2 Colour palette — *Navy + Blush on Cream*

| Token            | Hex       | Usage                                                              |
| ---------------- | --------- | ------------------------------------------------------------------ |
| `--bg`           | `#F8F1E7` | Page background, large surfaces                                    |
| `--surface`      | `#FFFFFF` | Product cards, inputs, contrast blocks within sections             |
| `--blush`        | `#EAC8C2` | Accent, badges, hover states, "Custom Orders" pill, soft tiles     |
| `--blush-deep`   | `#D9A89F` | Active accent, dates in markets list, hover deepening              |
| `--navy`         | `#142A44` | Primary brand colour — headings, buttons, footer, custom CTA block |
| `--birch`        | `#B68A65` | Warm secondary — wood-tone tiles, dividers, occasion tiles         |
| `--ink`          | `#1F1A15` | Body text, deep typography                                         |
| `--line`         | `rgba(20,42,68,0.12)` | Borders, divider lines                                  |

### 2.3 Typography

| Role                  | Font                | Weight        | Notes                                                  |
| --------------------- | ------------------- | ------------- | ------------------------------------------------------ |
| Display / Headings    | **Playfair Display** | 600 (semibold) | Echoes the `BY DESIGN` serif in the logo               |
| Hero headline         | Playfair Display    | 600           | 36–56px responsive                                     |
| Section heading (h2)  | Playfair Display    | 600           | 22–32px                                                |
| Product title         | Playfair Display    | 600           | 22–28px                                                |
| Body                  | **Inter**           | 400 / 500     | All paragraphs, descriptions                           |
| Eyebrow label         | Inter               | 600           | 11px UPPERCASE, letter-spacing 0.22em                  |
| Button / nav          | Inter               | 600–700       | 12–13px UPPERCASE, letter-spacing 0.10–0.15em          |
| Numeric / price       | Playfair Display    | 600           | Lets prices feel deliberate, not loud                  |

Both fonts loaded from Google Fonts with `display=swap`. System-font fallback stack on each.

### 2.4 Spacing & shape

- Generous vertical rhythm — section padding `64–96px` desktop, `40–56px` mobile.
- Border radius: `6px` (small chips), `8px` (inputs/cards), `12px` (large mockup/tile cards), `999px` (pill buttons & badges).
- Buttons: pill-shaped (`999px`), navy fill with cream text, or ghost (navy outline on cream).

---

## 3. Information architecture

### 3.1 Primary nav

`Shop` · `Custom` · `Markets` · `About`

- **Shop** opens a two-column mega-menu on hover (desktop) or a nested drawer (mobile):
  - Left column heading **"By Category"** — Keychains, Ornaments, Teacher Gifts, Earrings, Signs
  - Right column heading **"By Occasion"** — Birthday, Christmas, Baby & Kids, Easter, Valentine's, Halloween, Teacher
- **Custom** → custom orders request page
- **Markets** → upcoming events calendar
- **About** → maker story

### 3.2 Utility nav (right side of header)

`Search` · `Wishlist` · `Cart`

### 3.3 Footer

- Newsletter signup (single email field + button)
- Secondary nav (Shipping, Returns, FAQ, Contact)
- Social links (Instagram, TikTok if applicable, Etsy)
- Payment icons
- Tagline: "Handmade in Ontario · Made by Marielle"
- Copyright

---

## 4. Homepage design

Section order (top → bottom), each rendered as a reusable Shopify section editable in the theme editor:

1. **Hero — Category Tiles**
   - Eyebrow ("handmade in ontario") + Playfair headline + Inter sub-line
   - 4 large square tiles in a responsive grid (4-up desktop, 2-up tablet, 1-up mobile)
   - Each tile: background image, Playfair label, Inter count/subtitle
   - Tile content editable as section blocks (image, label, sublabel, link)
2. **Shop by Occasion**
   - Same tile pattern but reading "occasion" not "category"
   - 4 occasion tiles (Birthday · Christmas · Baby & Kids · Teacher)
3. **Bestsellers**
   - Section heading + eyebrow
   - 4-up product card grid pulling from a manually curated collection (`bestsellers`)
4. **Custom Orders Banner**
   - Full-width navy block (`--navy` background, cream text)
   - Blush "Custom Orders" pill badge, Playfair heading, lede, blush-filled CTA button → `/pages/custom-orders`
5. **Reviews**
   - Eyebrow + heading ("700+ happy customers" or similar)
   - 2–3 featured reviews, each with stars, quote, customer first name. Manually curated via metaobject `featured_review`.
6. **Upcoming Markets**
   - Eyebrow + heading
   - List of next 3 upcoming markets from `market_event` metaobject. Each row: date (Playfair, blush-deep), market name (navy), time (small muted).
   - Link to `/pages/markets` for the full list.
7. **Instagram Strip**
   - 6 tiles, latest from `@clarkebydesign3d`
   - Implementation: Shopify Instagram app of choice (or hardcoded image grid that owner replaces seasonally — simpler for v1)
8. **Newsletter / Footer**
   - Newsletter signup block above the footer

---

## 5. Product page design

### 5.1 Layout

- Two-column desktop, single-column mobile.
- **Left column** (sticky on desktop):
  - Primary product image (large, `1:1` aspect)
  - 4-thumb gallery row below; active thumb has navy outline + offset
- **Right column** (sticky on desktop until form ends):
  - Eyebrow (collection name)
  - `h1` product title (Playfair)
  - Star rating + review count
  - Price
  - Short description (2–3 lines)
  - Personalization form (see §5.2)
  - Primary CTA (navy pill): "Add to Cart — $14.00"
  - Secondary CTA (ghost pill): "♥ Save for later"
- **Below the fold**:
  - Long description
  - Materials & care
  - Shipping & turnaround
  - Customer reviews
  - "You may also like" — 4-up product row

### 5.2 Personalization UI — *Visual chip picker* (B)

Form fields appear in this order, each as a distinct labeled block:

1. **Name** — text input. Char limit shown beneath (e.g. "Up to 10 characters"). Required.
2. **Backer color** — row of circular swatches (`36px` diameter, `2px` white border, `1.5px` line ring). Active swatch has `2px` navy ring + centered checkmark. Tooltip shows color name on hover.
3. **Letter color** — same swatch pattern.
4. **Font style** — row of rectangular "chip cards" each rendering a large sample glyph ("Aa") in the actual font, with the font name below in small UPPERCASE Inter. Active chip has navy border. Default font set is **3 options** (Script · Block · Marker); the available fonts per product are configurable via a `personalization.fonts` product metafield so different products can offer different lineups.
5. **Add-ons (optional)** — list of checkbox cards (`1.5px` border, `8px` radius), each with label and `+$X.XX` price aligned right. Default add-ons: gift wrap, mini-card. Customizable per product.

All inputs persist as **Shopify line-item properties** so they flow through cart → checkout → order without any external app.

### 5.3 Variant ↔ field mapping

Shopify limits products to a maximum of **3 options × ~100 variants**. To stay native, the mapping is:

| Personalization field | Storage                              | Why                                                        |
| --------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Backer colour         | Product **option 1** (variant)       | Drives inventory; the wood/acrylic blank is physical stock |
| Letter colour         | Product **option 2** (variant)       | Drives inventory of acrylic letter sheets                  |
| Add-on (gift wrap)    | Product **option 3** (variant)       | Cents-up price applied to the chosen variant               |
| Font style            | **Line-item property** (string)      | No inventory impact; rendered onto chosen variant          |
| Name                  | **Line-item property** (string)      | Per-order custom value                                     |
| Extra add-ons         | **Line-item property** (free) or separate add-on product (paid) | See §9 open question |

Line-item properties pass natively through cart → checkout → order → fulfillment with no app dependency.

### 5.4 Live preview (phase 2)

Stretch goal: bestselling 10 products get a live SVG overlay on the primary product image that renders the typed name in the selected font and colour over a template silhouette of the product. Updates on every keystroke / selection. Requires per-product SVG template authoring + a `theme.preview.js` rendering module. **Explicitly deferred from phase 1.**

---

## 6. Other key pages

### 6.1 Collection (category) page

- Tile grid (3-up desktop, 2-up tablet, 1-up mobile) of products in the collection
- Sticky left filter sidebar on desktop, drawer on mobile
- Filter facets: Occasion, Colour, Price range
- Sort: Newest, Best selling, Price ↑/↓
- Top of page: collection title (Playfair) + 1–2 line collection description editable per collection

### 6.2 Markets page

- Hero block: heading + brief blurb ("Find Clarke By Design in person")
- List of all upcoming `market_event` metaobjects, ordered by date ascending
- Each row: large Playfair date, market name, time, venue name, address, map link ("View on Google Maps"), "Add to calendar" link (`.ics` download via lightweight client-side generator)
- Past events collapsed beneath a "Past markets" toggle

### 6.3 Custom orders page

- Hero block: "Got something unique in mind?" + 1-paragraph intro
- 3-step process explainer (Describe → Quote within 48h → Approve & make)
- Form fields:
  - Name (text, required)
  - Email (email, required)
  - Project description (textarea, required)
  - Photo uploads (file, up to 5, optional)
  - Budget range (select, optional)
  - Deadline / date needed (date, optional)
- Submission routes to `clarkebydesign@gmail.com` and creates a Shopify draft order with a private note for tracking. Implementation TBD between native Shopify Forms + Customer accounts, vs a small embedded form app.
- Below form: gallery of 6–8 past custom pieces (manually curated)

### 6.4 About page

- Hero: portrait photo + Playfair "Hi, I'm Marielle"
- Long-form story (laser-cut + 3D-print process, Ontario studio, family business)
- Stats row: "1,350+ items made", "700+ Etsy orders", "Markets across Ontario" (editable as section blocks)
- Process gallery (3–4 in-progress / studio shots)
- Footer CTA: "Browse the shop" or "Request a custom piece"

### 6.5 Cart & checkout

- Cart drawer (right side, opens on add-to-cart) styled to palette/type
- Line items show personalization properties (Name: Lucas, Backer: Birch, etc.) beneath each title
- Subtotal, then primary CTA "Checkout"
- Checkout = Shopify standard, branded with logo, navy primary, cream background, Inter type
- **Local pickup** offered as a shipping rate at checkout for nearby postal codes (free). Configured via Shopify Local Delivery / Pickup app native to Shopify.

---

## 7. Theme architecture

### 7.1 Tech foundation

- Built on **Shopify Online Store 2.0** — sections + blocks editable in theme editor.
- Base theme: **Dawn** (Shopify official) forked and customized. Reasons: most modern OS 2.0 base, well-documented, vanilla-Liquid + plain JS (no framework).
- Language: Liquid, vanilla JS (ES modules), CSS (custom properties + utility classes, no preprocessor required).
- **No headless / Hydrogen / React for v1.** Owner can edit Liquid directly if needed.
- Translations: theme strings in `locales/en.default.json` from day one. French locale (`fr.json`) is a placeholder file in phase 1; populated in phase 2.

### 7.2 Theme sections inventory

Each becomes a reusable section a non-developer can drop on any page via the theme editor:

| Section                | Used on              | Blocks                                                              |
| ---------------------- | -------------------- | ------------------------------------------------------------------- |
| `hero-tiles`           | Home                 | Tile (image, label, sublabel, link)                                 |
| `occasion-tiles`       | Home                 | Tile (image, label, link)                                           |
| `product-row`          | Home, product pages  | (auto-pulled from collection setting)                               |
| `custom-banner`        | Home, any            | Heading, lede, CTA label, CTA link, background colour selector      |
| `featured-reviews`     | Home, any            | Review (stars, quote, name)                                         |
| `markets-list`         | Home, markets page   | (auto-pulled from `market_event` metaobject, with "limit" setting)  |
| `instagram-strip`      | Home                 | Image tile (image, link)                                            |
| `newsletter`           | Home, footer         | Heading, lede, placeholder, success message                         |
| `collection-grid`      | Collection           | (auto)                                                              |
| `product-personalize`  | Product              | (auto from product options + metafields)                            |
| `custom-form`          | Custom orders page   | Field rows configurable                                             |
| `about-stats`          | About                | Stat (value, label)                                                 |
| `image-with-text`      | Any                  | Image, heading, body, link                                          |

### 7.3 Data models

#### `market_event` metaobject

| Field         | Type    | Notes                                            |
| ------------- | ------- | ------------------------------------------------ |
| `name`        | text    | "Woodstock Christmas Market"                     |
| `start_date`  | date    | Required                                         |
| `end_date`    | date    | Optional (multi-day)                             |
| `start_time`  | text    | "11:00 AM"                                       |
| `end_time`    | text    | "4:00 PM"                                        |
| `venue_name`  | text    | "Woodstock Fairgrounds"                          |
| `address`     | text    | Full address                                     |
| `google_maps_url` | url | Pre-built map link                               |
| `notes`       | rich text | Free-form ("admission free", "indoor", etc.) |

#### `featured_review` metaobject

| Field      | Type      | Notes                              |
| ---------- | --------- | ---------------------------------- |
| `stars`    | int       | 1–5                                |
| `quote`    | rich text | The review text                    |
| `name`     | text      | "Sarah K."                         |
| `product`  | product reference | Optional — link to product |

### 7.4 Performance budget

- **Lighthouse mobile** ≥ 85 (Performance, Accessibility, SEO)
- Hero LCP < 2.5s on simulated 4G
- All product imagery served via Shopify CDN with responsive `srcset`, AVIF/WebP preferred, lazy-loaded below the fold
- Total JS bundle < 100KB compressed (excluding 3rd-party apps)
- No CSS frameworks; custom-property-driven stylesheet
- Google Fonts loaded with `preconnect` + `display=swap`

### 7.5 Accessibility

- WCAG 2.1 AA target
- All interactive controls keyboard-accessible with visible focus ring (navy 2px outline)
- Colour-name tooltips on swatches (visual + screenreader)
- Form labels never visually hidden; required fields marked with both `*` and `aria-required`
- Alt text on all product images sourced from Shopify alt-text field

---

## 8. Phasing

### Phase 1 — Launch (target)

Everything in §1–7 except where marked phase 2:
- Theme built on Dawn fork with all sections in §7.2
- Visual chip picker personalization (no live preview)
- English-only content; French structure ready
- Markets, Custom Orders, About pages
- Local pickup at checkout
- Lighthouse ≥ 85 mobile

### Phase 2 — Post-launch upgrades

- Live SVG preview on top 10 bestseller product pages
- French (fr-CA) translations rolled out
- Advanced collection filters (multi-facet, price slider)
- Email automation (abandoned cart, welcome series) — Klaviyo or Shopify Email
- Loyalty / repeat-customer programme (TBD)

### Phase 3 — Stretch

- Customer accounts with saved personalization templates
- Wholesale / teacher-bulk-order portal
- B2B quote requests

---

## 9. Open questions for implementation

These remain to settle during implementation, not blocking design:

1. **Custom order form delivery** — native Shopify contact form + email, or a form app like Powr / Hulk? Decision driven by photo upload requirements.
2. **Add-on pricing model** — cents-up variants (cleanest, manual product setup) vs. an add-on app (faster setup, monthly cost).
3. **Instagram strip** — Shopify-app-driven live feed vs. hardcoded image grid (seasonal manual swap by owner). App adds cost; manual is fine if owner refreshes monthly.
4. **Logo SVG** — need a clean SVG from owner for crisp scaling. PNG is fine as fallback.
5. **Live preview rendering library (phase 2)** — vanilla SVG manipulation vs. a small canvas lib like `fabric.js`. Decided when phase 2 begins.

---

## 10. Approval

This design is approved by the owner (Marielle Clarke) as of 2026-05-20. Implementation planning begins next via the `superpowers:writing-plans` skill.
