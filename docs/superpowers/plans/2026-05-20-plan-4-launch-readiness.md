# Plan 4 — Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Clarke By Design Shopify theme from "feature-complete on a dev store" to "live, branded, fast, accessible, and bilingual-ready on the production storefront" — covering local-pickup checkout config, French locale scaffolding (theme strings only), Lighthouse-driven performance polish, WCAG 2.1 AA accessibility pass, a full pre-launch smoke checklist, and the production deploy itself.

**Architecture:** This plan is mostly Shopify admin configuration plus a small amount of theme code: `<link rel="preload">` hints for hero font + LCP image in `layout/theme.liquid`, a deferred non-critical CSS pattern, a single Liquid block in the cart drawer to surface local-pickup availability, and a populated `locales/fr.json` whose **theme-string keys only** are pre-translated. Content translation (product descriptions, page copy) is owner work via the Shopify Translate & Adapt app — out of scope here.

**Tech Stack:**
- Shopify admin (Settings → Shipping & delivery → Local pickup; Apps → Translate & Adapt)
- Liquid (preload hints, local-pickup notice block)
- JSON (`locales/fr.json` translations of theme strings from Plan 1 onward)
- Chrome DevTools Lighthouse (Performance / Accessibility / SEO audits)
- WAVE, axe DevTools, or Lighthouse a11y for screen-reader / WCAG checks
- Contrast checker (e.g. WebAIM Contrast Checker)
- Shopify CLI (`shopify theme push --live`) for production deploy

---

## File Structure

```
.
├── layout/
│   └── theme.liquid                    # MODIFY — add <link rel="preload"> hints + deferred CSS pattern
├── locales/
│   ├── en.default.json                 # MODIFY — confirm theme strings exist (audit pass)
│   └── fr.json                         # POPULATE — pre-translate theme strings; product/page copy is owner via Translate & Adapt
├── sections/
│   └── cart-drawer.liquid              # MODIFY — append local-pickup-notice block (or main-cart-footer.liquid in Dawn)
├── snippets/
│   └── local-pickup-notice.liquid      # CREATE — small reusable Liquid block surfacing "Local pickup available in Woodstock area"
├── assets/
│   └── snippet-local-pickup.css        # CREATE — minimal styles for the pickup notice pill
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-05-20-plan-4-launch-readiness.md   # this file
```

No new sections are added. The performance / accessibility / smoke-test tasks are verification, not file creation.

---

## Pre-flight: confirm Plans 1–3 are merged and the dev store is feature-complete

Before any task in this plan: verify the foundation, product personalization, and supporting pages from Plans 1–3 are live on the **dev store** and tagged.

- [ ] **Step P1: Verify prior plan tags exist**

```bash
cd "d:/WarpForged Terrain/ClarkeByDesign Shopify"
git tag --list
```
Expected: at minimum `v0.1.0-foundation` exists (Plan 1). Plans 2 and 3 tags (e.g. `v0.2.0-product`, `v0.3.0-pages`) should also be present if completed.

- [ ] **Step P2: Confirm theme check is clean**

```bash
npm run check
```
Expected: zero errors. Any warnings should be triaged before launch (see Task 6).

- [ ] **Step P3: Confirm dev store preview renders end-to-end**

Open the dev store preview URL. Click through every page in the nav: Home → Shop (mega-menu, each category and occasion) → a product page → cart drawer → Markets → Custom → About → Footer links. **No 404s, no Liquid errors, no missing-data placeholders.** If anything is broken, fix in the appropriate plan branch before continuing — Plan 4 is launch readiness, not feature work.

---

## Task 1: Configure native Shopify Local Pickup

This is **admin configuration, not theme code**. The owner enables Shopify's built-in Local Pickup feature for the Woodstock studio location. The theme already shows shipping options at checkout — Shopify renders pickup as a shipping rate automatically once configured.

**Files:** none (admin only)

- [ ] **Step 1.1: Confirm or create the studio location in Shopify admin**

Shopify admin → **Settings → Locations**.

If the studio is not already listed, click **Add location**:
- Name: `Clarke By Design Studio`
- Address: owner's studio address (Woodstock, Ontario)
- "Fulfill online orders from this location" → **on**

Save. Note the location appears in the locations list.

- [ ] **Step 1.2: Enable Local Pickup for the studio location**

Shopify admin → **Settings → Shipping and delivery**.

Scroll to **Local pickup** → next to the studio location row, click **Manage**.

Toggle **This location offers local pickup** → on.

Fill in:
- **Expected pickup time:** `Usually ready in 3–5 days` (matches owner's stated turnaround in spec §5; adjust per current capacity).
- **Order ready notification:** leave Shopify's default email template (owner can customize later in Settings → Notifications → "Ready for pickup").
- **Pickup instructions (optional):** `We'll email you when your order is ready. Pickup is from the studio porch in Woodstock — exact address is in your confirmation email.`

Click **Save**.

- [ ] **Step 1.3: Verify pickup shows in checkout for an Ontario address**

Open the dev store preview. Add any product to cart → proceed to checkout → enter a Woodstock, Ontario shipping address with a valid postal code → at the **Shipping method** step, Shopify should now display **Pickup** as a free option alongside shipping rates.

Expected: a "Pickup" radio option labeled with the studio location and "Usually ready in 3–5 days". If it doesn't appear, re-check Step 1.2 — the location must have inventory of the product being tested.

- [ ] **Step 1.4: Create `snippets/local-pickup-notice.liquid`**

This is a tiny Liquid include that surfaces a passive notice in the cart drawer letting customers know pickup is an option. It does **not** gate behavior — Shopify's checkout still handles the actual selection. This is awareness/marketing copy.

```liquid
{%- comment -%}
  Renders a "Local pickup available" notice. Drop this into the cart drawer or product page
  to surface Shopify's native Local Pickup option to customers.
  Usage: {% render 'local-pickup-notice' %}
{%- endcomment -%}
{{ 'snippet-local-pickup.css' | asset_url | stylesheet_tag }}

<div class="local-pickup-notice" role="note">
  <span class="local-pickup-notice__pill">{{ 'cart.pickup.label' | t }}</span>
  <p class="local-pickup-notice__text">{{ 'cart.pickup.body' | t }}</p>
</div>
```

- [ ] **Step 1.5: Create `assets/snippet-local-pickup.css`**

```css
.local-pickup-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  margin: 12px 0;
  background: rgb(var(--color-blush) / 0.35);
  border-radius: var(--radius-md);
  border: 1px solid rgb(var(--color-blush-deep) / 0.5);
}
.local-pickup-notice__pill {
  flex: 0 0 auto;
  background: rgb(var(--color-navy));
  color: rgb(var(--color-bg));
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
}
.local-pickup-notice__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgb(var(--color-navy));
}
```

- [ ] **Step 1.6: Add the notice strings to `locales/en.default.json`**

Open `locales/en.default.json` and add (merge into the existing `cart` group, or create one if absent):

```json
{
  "cart": {
    "pickup": {
      "label": "Local pickup",
      "body": "Free pickup available from the Woodstock studio — choose it at checkout."
    }
  }
}
```

- [ ] **Step 1.7: Render the snippet in the cart drawer**

Open the cart drawer / cart page section file (in Dawn this is typically `sections/cart-drawer.liquid` and/or `sections/main-cart-footer.liquid` — Plan 2 may have customized one of these). Locate the block that renders the subtotal, and **immediately above** the subtotal row, insert:

```liquid
{% render 'local-pickup-notice' %}
```

If the project has both a drawer and a full cart page, render it in the cart drawer **only** for v1 — the page is a fallback path and the drawer is the primary surface.

- [ ] **Step 1.8: Visual smoke test**

```bash
npm run dev
```
Add any product to cart → cart drawer opens → confirm the blush "Local pickup" notice appears above the subtotal. Confirm the navy pill, body text, and rounded card style match the brand tokens.

- [ ] **Step 1.9: Commit**

```bash
git add snippets/local-pickup-notice.liquid assets/snippet-local-pickup.css locales/en.default.json sections/cart-drawer.liquid
git commit -m "feat(cart): surface local pickup availability notice in cart drawer"
```

---

## Task 2: French locale rollout — theme strings only

**Scope clarification (read carefully):** Plan 4 ships a **populated French locale file (`locales/fr.json`)** for **theme strings** — every key the theme renders via `{{ '...' | t }}` (section eyebrows, button labels, headings, form placeholders, alt-text patterns, etc.). It does **NOT** translate product titles, descriptions, collection copy, page bodies, or metaobject content. Those are translated by the owner inside Shopify's **Translate & Adapt** admin app on a per-record basis. This task installs that app and tells the owner where to find it — actual content translation is owner work, not theme work.

**Files:**
- Modify: `locales/fr.json` (replace empty placeholder from Plan 1 Task 15 with translated values)
- Verify: `locales/en.default.json` (every theme-rendered string has a key)

- [ ] **Step 2.1: Install the Translate & Adapt app**

Shopify admin → **Apps → Shopify App Store** → search "Translate & Adapt" (it's a free first-party Shopify app) → **Install**.

After install, open the app from the admin sidebar. You'll see your default language (English) and a button to **Add language**. Click it → select **French (Canada)** (`fr-CA`). Save.

The app now exposes a translation UI for products, collections, pages, blog articles, navigation, metaobjects, and theme content. Do **not** start translating product content here — only configure the language. Content translation is post-launch.

- [ ] **Step 2.2: Audit `locales/en.default.json` for completeness**

Plan 1 left this file as the Dawn default plus any additions during build. Open it and verify every visible string the theme renders has an English key. Specifically check that the section default strings introduced in Plan 1 (and any added in Plans 2–3) exist in the locale file — if any were inlined in Liquid as literals, move them to the locale file now using a `{{ 'group.key' | t }}` reference.

Run this quick visual scan:

```bash
npm run check
```

Theme Check will flag any inline English literals that should be in locales. Address any `MissingTranslation` warnings before continuing.

- [ ] **Step 2.3: Populate `locales/fr.json` with theme-string translations**

Plan 1 Task 15 created `locales/fr.json` as an empty-value mirror of the English file. Now fill in the French equivalents for **the strings the theme defines for our custom sections**. The Dawn-shipped strings (cart, search, product card defaults, etc.) Shopify maintains automatically through Translate & Adapt — leave those keys present but empty if Shopify's app populates them, or copy from Shopify's public Dawn `fr.json` if you want a head start.

Replace `locales/fr.json` with the following (merge into the structure your file already has — keep all existing keys, just translate values). These cover every custom string introduced by Plans 1–3:

```json
{
  "general": {
    "search": {
      "search": "Rechercher"
    },
    "wishlist": "Favoris",
    "cart": "Panier",
    "menu": "Menu"
  },
  "sections": {
    "hero_tiles": {
      "eyebrow": "fait main en ontario",
      "heading": "Cadeaux personnalisés, faits juste pour vous.",
      "sub": "Choisissez une catégorie pour commencer.",
      "tile_count_suffix": "modèles"
    },
    "occasion_tiles": {
      "eyebrow": "magasinez par occasion",
      "heading": "Quel est le moment?",
      "lede": "Des cadeaux regroupés selon la journée que vous célébrez.",
      "labels": {
        "birthday": "Anniversaire",
        "christmas": "Noël",
        "baby_kids": "Bébés et enfants",
        "teacher": "Enseignants"
      }
    },
    "product_row": {
      "eyebrow_bestsellers": "meilleures ventes",
      "heading_bestsellers": "Ce que tout le monde commande",
      "link_label_shop_all": "Voir tout"
    },
    "custom_banner": {
      "badge": "Commandes sur mesure",
      "heading": "Une idée bien à vous?",
      "lede": "Envoyez-nous votre idée — on vous envoie un prix sous 48 heures.",
      "cta_label": "Demander une pièce sur mesure"
    },
    "featured_reviews": {
      "eyebrow": "ce que disent les clients",
      "heading": "Plus de 700 clients comblés",
      "lede": "Et ça grandit à chaque saison de marchés."
    },
    "markets_list": {
      "eyebrow": "rencontrez-nous en personne",
      "heading": "Prochains marchés",
      "all_label": "Voir tous les marchés",
      "empty": "Aucun marché prévu pour le moment — revenez bientôt."
    },
    "instagram_strip": {
      "heading": "Suivez l'aventure sur Instagram"
    },
    "newsletter": {
      "eyebrow": "rejoignez la liste",
      "heading": "Soyez les premiers au courant",
      "lede": "Nouveautés, restock saisonniers et coulisses de l'atelier.",
      "placeholder": "vous@courriel.com",
      "button_label": "S'abonner",
      "success_message": "Merci de votre inscription — surveillez votre boîte de réception."
    }
  },
  "product": {
    "personalize": {
      "name_label": "Prénom",
      "name_help": "Jusqu'à 10 caractères",
      "name_required": "Un prénom est requis pour personnaliser ce cadeau.",
      "backer_color_label": "Couleur de fond",
      "letter_color_label": "Couleur des lettres",
      "font_label": "Police",
      "addons_label": "Ajouts (facultatif)",
      "addon_gift_wrap": "Emballage cadeau",
      "addon_mini_card": "Mini-carte"
    },
    "cta": {
      "add_to_cart": "Ajouter au panier",
      "save_for_later": "Enregistrer pour plus tard"
    },
    "below_fold": {
      "long_description": "Description",
      "materials_care": "Matériaux et entretien",
      "shipping_turnaround": "Livraison et délais",
      "reviews": "Avis des clients",
      "you_may_also_like": "Vous pourriez aussi aimer"
    }
  },
  "cart": {
    "pickup": {
      "label": "Cueillette locale",
      "body": "Cueillette gratuite à l'atelier de Woodstock — choisissez-la à la caisse."
    },
    "subtotal": "Sous-total",
    "checkout": "Passer à la caisse"
  },
  "footer": {
    "tagline": "Fait main en Ontario · Par Marielle",
    "newsletter_heading": "Restez à l'affût",
    "social_heading": "Suivre",
    "rights_reserved": "Tous droits réservés."
  },
  "custom_orders": {
    "hero_heading": "Une idée bien à vous?",
    "step_1": "Décrivez",
    "step_2": "Devis sous 48h",
    "step_3": "Approuvez et créez",
    "form": {
      "name": "Prénom",
      "email": "Courriel",
      "description": "Décrivez votre projet",
      "photos": "Photos (facultatif, jusqu'à 5)",
      "budget": "Budget approximatif",
      "deadline": "Date souhaitée",
      "submit": "Envoyer la demande"
    }
  },
  "about": {
    "heading": "Bonjour, je suis Marielle",
    "browse_shop": "Visiter la boutique",
    "request_custom": "Demander une pièce sur mesure"
  }
}
```

> **Note:** If Plans 2 or 3 introduced additional theme keys not listed here (likely — e.g. personalization swatch tooltip text, markets page row labels), add French translations for those too. Use the rule: any English string the theme renders directly should have a French sibling. If the key already had an empty value from Plan 1 Step 15.2, fill it; if the key is missing entirely, add it to both `en.default.json` and `fr.json`.

- [ ] **Step 2.4: Confirm Shopify recognizes the French locale**

```bash
npm run dev
```

In the preview URL, append `?locale=fr` (e.g. `https://...trycloudflare.com/?locale=fr&preview_theme_id=...`).

Expected: every translated theme string renders in French. Product titles and page bodies remain in English (those are content, translated separately via Translate & Adapt). If any theme string still shows in English when `?locale=fr` is active, that string isn't going through the locale file — track it down and fix.

- [ ] **Step 2.5: Confirm fr-CA is published in the storefront admin**

Shopify admin → **Settings → Languages** → confirm **French (Canada)** is listed as an **Unpublished** language. Leave it **Unpublished** until product content is translated post-launch — the owner can then **Publish** to add `/fr` URLs to the live storefront.

- [ ] **Step 2.6: Owner handoff note (no code)**

Document for the owner in `locales/fr.json` itself with a top-level `_README` key (Shopify ignores keys prefixed with `_`):

Open `locales/fr.json` and add at the **top** of the JSON object (before all other keys):

```json
"_README": "This file translates THEME STRINGS only (section headings, button labels, form placeholders). Translate product names, descriptions, page bodies, and metaobject content via Shopify admin → Apps → Translate & Adapt. Publish the French language in Settings → Languages once content is translated."
```

- [ ] **Step 2.7: Commit**

```bash
git add locales/fr.json locales/en.default.json
git commit -m "i18n(fr): pre-translate theme strings for French (Canada) launch readiness"
```

---

## Task 3: Performance pass — Lighthouse mobile ≥ 85

Run Lighthouse mobile audit, fix the highest-impact wins, re-run, iterate until Performance / Accessibility / SEO are each ≥ 85.

**Files:**
- Modify: `layout/theme.liquid` (preload hints, deferred non-critical CSS)
- Verify (no changes expected): every `image_url` filter in Plans 1–3 already uses width + srcset

- [ ] **Step 3.1: Run baseline Lighthouse mobile audit**

In Chrome DevTools → **Lighthouse** tab → Device: **Mobile**, Categories: **Performance, Accessibility, Best Practices, SEO** → click **Analyze page load** against the preview URL homepage.

Record the four scores. If all four are already ≥ 85, skip to Task 3.7 (preload hints — still worth adding) and then Task 3.8 (commit). If any are < 85, continue.

- [ ] **Step 3.2: Add `<link rel="preload">` for the hero LCP image**

The hero section's first tile image is almost always the LCP element on mobile. Preloading it shaves 200–600ms off LCP.

Open `layout/theme.liquid`. Inside `<head>`, after the existing Google Fonts preconnects (Plan 1 Task 3.2) and **before** the `{{ content_for_header }}` line, add:

```liquid
{%- comment -%} Preload hero LCP image on the homepage only {%- endcomment -%}
{%- if template.name == 'index' -%}
  {%- assign hero_section = sections['hero-tiles'] | default: section -%}
  {%- assign first_tile = hero_section.blocks | first -%}
  {%- if first_tile.settings.image -%}
    <link rel="preload" as="image"
          href="{{ first_tile.settings.image | image_url: width: 800 }}"
          imagesrcset="{{ first_tile.settings.image | image_url: width: 320 }} 320w,
                       {{ first_tile.settings.image | image_url: width: 480 }} 480w,
                       {{ first_tile.settings.image | image_url: width: 640 }} 640w,
                       {{ first_tile.settings.image | image_url: width: 800 }} 800w"
          imagesizes="(min-width: 880px) 25vw, (min-width: 600px) 50vw, 100vw">
  {%- endif -%}
{%- endif -%}
```

If Plan 1 named the hero section JSON key differently than `'hero-tiles'`, adjust the lookup accordingly.

- [ ] **Step 3.3: Preload the hero display font**

Playfair Display is the hero headline font and a render-blocking dependency for the LCP text. Preload its woff2 file.

In `<head>` of `layout/theme.liquid`, immediately after the existing Google Fonts `<link>` for Playfair + Inter, add:

```liquid
<link rel="preload" as="font" type="font/woff2"
      href="https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQZNLo_U2r.woff2"
      crossorigin>
```

> Note: the exact woff2 URL above is the current Playfair Display semibold weight from Google Fonts CDN. If Google rotates the font file (rare), this preload becomes a no-op (no harm). Verify the URL by visiting the Google Fonts CSS URL Plan 1 already loads (`https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap`) in the browser and grabbing the woff2 URL for weight 600 from the response.

- [ ] **Step 3.4: Defer non-critical CSS**

Section CSS files (`section-hero-tiles.css`, `section-occasion-tiles.css`, etc.) are loaded per-section via `{{ 'section-xxx.css' | asset_url | stylesheet_tag }}`. Shopify already inlines critical CSS for above-the-fold content automatically when using `stylesheet_tag`. **No change needed for section CSS.**

The one place to add a `media="print"`-swap pattern for genuinely below-the-fold-only stylesheets is `assets/footer.css`. Modify the footer section to load its CSS deferred:

In `sections/footer.liquid`, change the first line from:

```liquid
{{ 'footer.css' | asset_url | stylesheet_tag }}
```

to:

```liquid
<link rel="stylesheet" href="{{ 'footer.css' | asset_url }}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="{{ 'footer.css' | asset_url }}"></noscript>
```

This loads the footer CSS without blocking initial render, then applies it once the browser is idle.

- [ ] **Step 3.5: Verify image sizing is correct site-wide**

Plans 1–3 should have used `image_url: width: X | image_tag: widths: '...', sizes: '...'` everywhere. Confirm by grepping the repo:

```bash
npm run check
```
Theme Check will flag `ImgWidthAndHeight`, `RemoteAsset`, and `ImgLazyLoading` issues. Resolve any flagged.

In Chrome DevTools → **Network** tab → reload the homepage → filter by **Img** → sort by Size descending. The largest image should be **< 200 KB** at mobile viewport (375px wide). If any image is significantly larger, the `image_url: width:` filter is being called with too large a width — reduce it.

- [ ] **Step 3.6: Audit JS payload**

In Chrome DevTools → **Network** → filter **JS** → confirm only `theme.js` (Plan 1) and any product-page personalization JS (Plan 2) are loading on the homepage. **No app scripts, no analytics scripts beyond Shopify defaults.** Total transferred JS should be **< 100 KB** uncompressed.

If a third-party app injected JS that's not actually being used on the homepage (e.g. a review app loading on every page), uninstall the app or check whether it has a "load only on product page" setting.

- [ ] **Step 3.7: Re-run Lighthouse mobile**

Repeat Step 3.1. Targets:
- **Performance ≥ 85**
- **Accessibility ≥ 85** (Task 4 will push this further)
- **Best Practices ≥ 90**
- **SEO ≥ 85**

LCP should be **< 2.5s** on simulated 4G. CLS should be **< 0.1**. If LCP is still > 2.5s, the hero image is too large or not actually getting preloaded — re-check Step 3.2 in the Network tab's **Priority** column (the preload should show as **High**).

- [ ] **Step 3.8: Commit performance changes**

```bash
git add layout/theme.liquid sections/footer.liquid
git commit -m "chore(perf): preload hero LCP image and Playfair font; defer footer CSS"
```

---

## Task 4: Accessibility pass — WCAG 2.1 AA

Verify keyboard navigation, focus rings, alt text, color contrast, form labels, and ARIA roles across the entire site.

**Files:** mostly verification, with targeted fixes as needed. No new files expected.

- [ ] **Step 4.1: Keyboard navigation audit**

Open the homepage. Press **Tab** repeatedly and verify the entire site is keyboard-navigable in a logical reading order:

| Step | Expected focus target |
|---|---|
| 1 | Skip-to-content link (Dawn ships one — confirm visible on focus) |
| 2 | Header logo |
| 3 | Each primary nav item in order (Shop → Custom → Markets → About) |
| 4 | Search / Wishlist / Cart icon buttons |
| 5 | Mobile menu button (hidden on desktop but tab-reachable if viewport is < 880px) |
| 6 | Each hero tile in order |
| 7 | Each occasion tile in order |
| 8 | Bestseller cards |
| 9 | Custom banner CTA |
| 10 | Each market row link (if linked) |
| 11 | Instagram tiles |
| 12 | Newsletter email input → submit button |
| 13 | Footer link lists (in source order) |
| 14 | Social icons |

At every stop, confirm a **visible navy 2px focus ring** with 2px offset is showing (this is set in `assets/base.css` `:focus-visible` from Plan 1 Task 3.1). If a focus ring is missing on any element, the element is likely a `div` styled to look like a button — change it to `<button>` or `<a>` and re-test.

- [ ] **Step 4.2: Keyboard test the personalization UI (Plan 2)**

On a product page, tab through the personalization form:
- Name input — focus ring, keyboard typeable, character limit announced (via the `<small>` help text)
- Backer color swatches — should be focusable buttons; **Space/Enter** activates them; arrow keys optionally cycle (nice-to-have, not required for AA)
- Letter color swatches — same
- Font chip cards — same
- Add-on checkboxes — focusable, Space toggles, label clickable
- "Add to Cart" button — focus ring, Enter submits

If any swatch or chip is a `<div>` with a click handler instead of a `<button>`, change it to `<button type="button">` — this is required for both keyboard access and screen-reader announcement.

- [ ] **Step 4.3: Alt-text audit**

Run Theme Check:

```bash
npm run check
```

Theme Check's `ImgLazyLoading` and missing-alt checks will flag any image without alt text. For homepage section blocks (hero tiles, occasion tiles, Instagram strip), confirm the section schema includes a way for the owner to enter alt text **or** the alt is derived from a descriptive label setting (e.g. `block.settings.label`).

Open each section in the theme editor and verify alt-text fields exist or are derived. Specifically:
- `hero-tiles` — alt should be `block.settings.label` ("Keychains", etc.) — confirm in `sections/hero-tiles.liquid` the `image_tag` filter receives `alt: block.settings.label`
- `occasion-tiles` — same pattern
- `instagram-strip` — alt should be "Instagram post — @clarkebydesign3d" or similar generic descriptor
- `featured-reviews` — no images
- `product-card` — alt is `product.featured_image.alt` (Shopify auto-populates from admin)

If any are missing the alt parameter on `image_tag`, add it now and re-commit. Example fix in `sections/hero-tiles.liquid`:

```liquid
{{ block.settings.image | image_url: width: 800 | image_tag:
   alt: block.settings.label,
   widths: '320, 480, 640, 800',
   sizes: '(min-width: 880px) 25vw, (min-width: 600px) 50vw, 100vw',
   loading: 'eager',
   class: 'hero-tile__img' }}
```

- [ ] **Step 4.4: Color contrast verification**

Open WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/) and test each text-on-background pairing in the design:

| Foreground | Background | Hex pair | Required ratio (WCAG AA) | Expected result |
|---|---|---|---|---|
| Navy `#142A44` | Cream `#F8F1E7` | body, headings | 4.5:1 normal / 3:1 large | PASS (~14:1) |
| Cream `#F8F1E7` | Navy `#142A44` | custom banner CTA text | 4.5:1 / 3:1 | PASS |
| Navy `#142A44` | Blush `#EAC8C2` | "Custom Orders" pill | 4.5:1 / 3:1 | PASS (~9.6:1) |
| Navy `#142A44` | Blush deep `#D9A89F` | active accent text | 4.5:1 / 3:1 | check — borderline; if FAIL on normal text, restrict use to large display (≥ 18pt) or non-text accents |
| Ink `#1F1A15` | Cream `#F8F1E7` | body text | 4.5:1 | PASS (~14:1) |
| Birch `#B68A65` | Cream `#F8F1E7` | star rating glyphs | 3:1 for non-text | check — should pass for graphical elements but **fail** as small body text |

Run each pair in the checker. Record any FAIL — typical fix is either deepening the foreground colour for that specific text use or moving the text onto a different background. **Do not change the brand tokens themselves** (those are locked); change the application.

- [ ] **Step 4.5: Form labels and ARIA**

Inspect each form on the site (newsletter, custom-orders, product personalization, cart):

- Every `<input>` has either an associated `<label for="...">` **or** an `aria-label` — never both, never neither.
- Required fields have `required` attribute **and** `aria-required="true"`.
- Error messages are linked via `aria-describedby` to the input.
- Submit buttons have descriptive text (not "Submit" alone — "Send custom order request", "Subscribe", "Add to Cart").

The newsletter form in Plan 1 Task 12 uses `<label class="visually-hidden">Email</label>` — confirm `.visually-hidden` class is defined (it is, in Task 12 CSS). Good.

The custom-orders form in Plan 3 should have visible labels above each field (not placeholder-only). If any field uses placeholder as a label, fix it — placeholders disappear on focus and fail WCAG 2.1 SC 3.3.2.

- [ ] **Step 4.6: Screen reader spot-check**

On Windows, enable **Narrator** (Ctrl + Win + Enter) or install **NVDA** (free). Navigate the product personalization UI with screen reader on:

Expected announcements:
- "Name, edit, required" when focus enters the name input
- "Backer color, [color name], button, pressed" when focus enters an active swatch
- "Backer color, [color name], button, not pressed" for inactive swatches
- "Font Block, button, pressed" for active font chip
- "Gift wrap, plus $2.00, checkbox, not checked" for an add-on
- "Add to Cart, $14.00, button" for the primary CTA

If announcements are missing the role ("button") or state ("pressed"/"checked"), the controls are missing ARIA attributes. For swatches and font chips, add `aria-pressed="true"` / `aria-pressed="false"` to the active/inactive state. For checkboxes, the native `<input type="checkbox">` handles announcement automatically.

- [ ] **Step 4.7: Re-run Lighthouse Accessibility**

Open Lighthouse → Mobile → Accessibility only → run.

Target: **≥ 95**. Lighthouse will list specific elements failing. Fix and re-run until ≥ 95.

- [ ] **Step 4.8: Commit accessibility fixes**

If any fixes were made:

```bash
git add -A
git commit -m "chore(a11y): pass WCAG 2.1 AA — alt text, ARIA states, contrast verification"
```

If no code fixes were needed (only verification), skip the commit — note in `Self-Review` that audit passed clean.

---

## Task 5: SEO & metadata pass

**Files:**
- Verify: `layout/theme.liquid` `<head>` metadata
- Verify: each `templates/*.json` has appropriate page title / description settings

- [ ] **Step 5.1: Confirm `<title>` and meta description are set per page**

Open `layout/theme.liquid` and confirm `<head>` includes:

```liquid
<title>
  {%- if template == 'index' -%}{{ shop.name }} — Personalized gifts handmade in Ontario
  {%- elsif page_title contains shop.name -%}{{ page_title }}
  {%- else -%}{{ page_title }} | {{ shop.name }}
  {%- endif -%}
</title>
<meta name="description" content="{% if page_description != blank %}{{ page_description | escape }}{% else %}Personalized laser-cut and 3D-printed gifts handmade in Ontario by Marielle Clarke.{% endif %}">
```

Dawn ships a similar pattern — adapt rather than duplicate.

- [ ] **Step 5.2: Confirm Open Graph and Twitter card tags**

Dawn includes `<meta property="og:*">` tags by default. Verify they render correctly by viewing source on the homepage:
- `og:title` matches the page title
- `og:description` matches meta description
- `og:image` is the shop's logo or homepage hero (configurable in Shopify admin → Online store → Preferences → Social sharing image)

In admin → **Online Store → Preferences**, upload the brand homepage hero (or a clean studio shot) as the social sharing image (1200×630 recommended).

- [ ] **Step 5.3: Confirm `robots.txt` and sitemap**

Shopify auto-generates `/robots.txt` and `/sitemap.xml`. Visit `https://[dev-store].myshopify.com/sitemap.xml` and confirm it lists products, collections, and pages. No theme code needed.

- [ ] **Step 5.4: Submit sitemap to Google Search Console (post-launch step — note for owner)**

Document in the owner handoff (see Task 7) that after production deploy:
1. Verify domain in Google Search Console
2. Submit sitemap URL (`https://clarkebydesign.ca/sitemap.xml` or the chosen domain)
3. Submit the same sitemap to Bing Webmaster Tools

This step happens **after** Task 7, not now.

- [ ] **Step 5.5: Commit (if any changes)**

```bash
git add layout/theme.liquid
git commit -m "chore(seo): finalize title/meta-description pattern and OG defaults"
```

If `layout/theme.liquid` already had this from Plan 1, skip the commit.

---

## Task 6: Pre-launch smoke-test checklist

This is the **manual verification gate** between feature-complete and production deploy. Walk through every item. Each is PASS / FAIL — if anything FAILs, fix before continuing to Task 7.

Run all tests on **the dev store preview URL**, in both desktop Chrome (1440×900) and mobile Chrome (375×812 emulation via DevTools).

**Files:** none (verification only). Record findings inline as comments; commit the recorded checklist to `docs/superpowers/` only if the owner explicitly wants a launch-record archive.

### 6.1 Header & navigation

- [ ] **Step 6.1: Header sticks to top** on scroll — PASS / FAIL
- [ ] **Step 6.2: Logo links to homepage** — PASS / FAIL
- [ ] **Step 6.3: Shop mega-menu opens on hover (desktop) and tap (mobile drawer)** — PASS / FAIL
- [ ] **Step 6.4: Every primary nav link routes to a real page (no 404s)** — PASS / FAIL
- [ ] **Step 6.5: Search icon opens search page or modal** — PASS / FAIL
- [ ] **Step 6.6: Wishlist icon routes to `/pages/wishlist`** (even if page is "coming soon" placeholder, no 404) — PASS / FAIL
- [ ] **Step 6.7: Cart icon shows live item count and routes to cart** — PASS / FAIL
- [ ] **Step 6.8: Mobile menu button reveals nav drawer** — PASS / FAIL

### 6.2 Homepage sections

- [ ] **Step 6.9: Hero tiles** — 4-up desktop, 2-up tablet, 1-up mobile; each tile clicks through to the linked collection — PASS / FAIL
- [ ] **Step 6.10: Occasion tiles** — same responsive grid and link behavior — PASS / FAIL
- [ ] **Step 6.11: Bestsellers** — 4 cards render with real product images and prices (not placeholders) — PASS / FAIL
- [ ] **Step 6.12: Custom banner** — navy full-width, blush badge pill, CTA links to `/pages/custom-orders` — PASS / FAIL
- [ ] **Step 6.13: Featured reviews** — at least 2 reviews render with stars, quote, name — PASS / FAIL
- [ ] **Step 6.14: Markets list** — 3 upcoming markets render with date / name / time; past markets hidden — PASS / FAIL
- [ ] **Step 6.15: Instagram strip** — 6 tiles, each clicks through to either the Instagram profile or the specific post — PASS / FAIL
- [ ] **Step 6.16: Newsletter form** — submit a test email → success message appears → email is captured in admin → Customers (filtered by `newsletter` tag) — PASS / FAIL
- [ ] **Step 6.17: Footer** — 3 columns desktop, 1 column mobile; all link-list entries route correctly — PASS / FAIL

### 6.3 Collection / category pages

- [ ] **Step 6.18: Each category in the Shop mega-menu loads a populated collection page** — PASS / FAIL
- [ ] **Step 6.19: Filter sidebar (desktop) / drawer (mobile)** opens and applies filters — PASS / FAIL
- [ ] **Step 6.20: Sort dropdown** changes ordering (Newest, Best selling, Price ↑↓) — PASS / FAIL
- [ ] **Step 6.21: Pagination** works if any collection has > 24 products — PASS / FAIL

### 6.4 Product page (covered by Plan 2)

- [ ] **Step 6.22: Open a personalizable product** — image gallery shows 4 thumbnails, primary image is large 1:1 — PASS / FAIL
- [ ] **Step 6.23: Name field** — typeable, char limit enforced (try typing > 10 chars) — PASS / FAIL
- [ ] **Step 6.24: Backer color swatches** — click to select, active state visible — PASS / FAIL
- [ ] **Step 6.25: Letter color swatches** — same — PASS / FAIL
- [ ] **Step 6.26: Font chips** — click to select, active state visible — PASS / FAIL
- [ ] **Step 6.27: Add-ons** — toggle checkbox, price updates — PASS / FAIL
- [ ] **Step 6.28: Add to Cart** with a complete personalization → cart drawer opens → line shows Name/Backer/Letter/Font/Add-ons as properties below the product title — PASS / FAIL
- [ ] **Step 6.29: Save for later** ghost CTA visible — PASS / FAIL
- [ ] **Step 6.30: Below-fold sections** — long description, materials, shipping, reviews, "You may also like" all render — PASS / FAIL

### 6.5 Markets page (Plan 3)

- [ ] **Step 6.31: All upcoming markets list** with date / venue / address / Google Maps link / Add-to-calendar link — PASS / FAIL
- [ ] **Step 6.32: Past markets** collapsed under toggle — PASS / FAIL
- [ ] **Step 6.33: Add-to-calendar .ics download** opens a valid `.ics` file — PASS / FAIL

### 6.6 Custom orders page (Plan 3)

- [ ] **Step 6.34: 3-step explainer** renders — PASS / FAIL
- [ ] **Step 6.35: Form submits successfully** — fill in test data → submit → owner receives email at `clarkebydesign@gmail.com` AND a draft order appears in admin → Orders → Drafts — PASS / FAIL
- [ ] **Step 6.36: Photo upload** accepts up to 5 images, rejects oversize — PASS / FAIL
- [ ] **Step 6.37: Past-custom-pieces gallery** renders 6–8 images below the form — PASS / FAIL

### 6.7 About page (Plan 3)

- [ ] **Step 6.38: Portrait + "Hi, I'm Marielle" heading** renders — PASS / FAIL
- [ ] **Step 6.39: Stats row** ("1,350+ items made", etc.) renders — PASS / FAIL
- [ ] **Step 6.40: Process gallery** renders 3–4 studio images — PASS / FAIL
- [ ] **Step 6.41: Footer CTA** routes to shop or custom orders — PASS / FAIL

### 6.8 Cart & checkout

- [ ] **Step 6.42: Cart drawer** shows line items with personalization properties beneath each title — PASS / FAIL
- [ ] **Step 6.43: Local pickup notice** renders above subtotal in cart drawer — PASS / FAIL
- [ ] **Step 6.44: Subtotal** is accurate (sum of variants + cents-up add-ons) — PASS / FAIL
- [ ] **Step 6.45: Checkout button** routes to Shopify checkout — PASS / FAIL
- [ ] **Step 6.46: Checkout page** uses brand colors (navy primary, cream background, Inter type) — PASS / FAIL
- [ ] **Step 6.47: Local pickup option** appears alongside shipping rates for an Ontario address — PASS / FAIL
- [ ] **Step 6.48: Complete a test order** with a test gateway (Bogus Gateway) → order appears in admin → Orders → personalization line-item properties flow through to the order detail — PASS / FAIL

### 6.9 Performance & accessibility regression

- [ ] **Step 6.49: Lighthouse mobile homepage** — Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 85 — PASS / FAIL
- [ ] **Step 6.50: Lighthouse mobile product page** — same targets — PASS / FAIL
- [ ] **Step 6.51: Keyboard navigate the entire site** without a mouse, no traps, all focus rings visible — PASS / FAIL

### 6.10 i18n smoke

- [ ] **Step 6.52: Append `?locale=fr` to homepage URL** — all theme strings render in French; product content remains English (expected — content is not yet translated) — PASS / FAIL

### 6.11 Cross-browser

- [ ] **Step 6.53: Chrome desktop** — full smoke clean — PASS / FAIL
- [ ] **Step 6.54: Safari desktop (macOS, if available)** — visual check no broken layouts — PASS / FAIL
- [ ] **Step 6.55: Firefox desktop** — visual check — PASS / FAIL
- [ ] **Step 6.56: iOS Safari mobile (real device or BrowserStack)** — homepage + product + checkout work — PASS / FAIL
- [ ] **Step 6.57: Android Chrome mobile (real device or emulator)** — same — PASS / FAIL

**Gate:** Do not proceed to Task 7 until every item is PASS. If any FAIL, file a fix branch, fix, re-test, and only then return.

---

## Task 7: Production deployment

DNS, custom domain, final theme push, post-deploy verification.

**Files:** none (mostly admin and CLI).

- [ ] **Step 7.1: Owner registers the production Shopify plan**

Shopify admin → **Settings → Plan** → select the appropriate plan (Basic is fine for v1). Provide billing info. Confirm the plan is active.

This converts the dev store from "development" to "live-eligible". Until this is done, `theme.push --live` cannot publish to a real customer-facing storefront.

- [ ] **Step 7.2: Owner registers / configures the custom domain**

If the owner has not yet purchased `clarkebydesign.ca` (or chosen domain):
- Buy directly through Shopify admin → **Settings → Domains → Buy new domain** (simplest — Shopify handles DNS for you), OR
- Buy externally (e.g. Cloudflare Registrar, GoDaddy) and connect via **Settings → Domains → Connect existing domain**.

Whichever path:

Shopify admin → **Settings → Domains** → confirm domain status is **Connected** and SSL certificate is **Issued** (Shopify auto-provisions a Let's Encrypt cert). This can take up to 48 hours for DNS propagation if connecting an external domain; budget for this in launch timing.

Set the domain as **Primary** (toggle on the domain row).

- [ ] **Step 7.3: Final settings sweep**

Walk through Shopify admin → **Settings** top-to-bottom:

- **General:** store name, address, contact email all set
- **Plan:** confirmed active (Step 7.1)
- **Billing:** payment method on file
- **Users and permissions:** owner is sole admin (no leftover dev collaborators)
- **Payments:** Shopify Payments or alternative processor configured and verified
- **Checkout:** customer accounts set to **Optional** (per spec — guest checkout allowed), abandoned cart email enabled
- **Shipping and delivery:** general shipping rates set (Canada Post calculated or flat-rate), Local Pickup confirmed enabled from Task 1
- **Taxes and duties:** Canadian GST/HST configured for Ontario
- **Locations:** studio location is primary
- **Markets:** only **Canada** is active; archive any default international market (US duties / VAT concerns out of scope for v1)
- **Apps and sales channels:** confirm Translate & Adapt installed (Task 2); remove any unused apps
- **Domains:** custom domain primary (Step 7.2)
- **Notifications:** review the customer-facing email templates (order confirmation, shipping, pickup ready) — brand colors render correctly
- **Languages:** French (Canada) listed as Unpublished (Task 2.5)
- **Policies:** **Privacy policy**, **Refund policy**, **Shipping policy**, **Terms of service** all drafted and saved (Shopify provides starter templates under Settings → Policies)

Mark each as confirmed before continuing.

- [ ] **Step 7.4: Theme final check**

```bash
cd "d:/WarpForged Terrain/ClarkeByDesign Shopify"
npm run check
```
Expected: zero errors, zero unresolved warnings.

- [ ] **Step 7.5: Push theme as unpublished to production store first**

```bash
shopify auth login --store [production-store-handle].myshopify.com
shopify theme push --unpublished --theme-name "Clarke By Design v1.0"
```
Expected: theme uploads to the live store as an **unpublished** theme. The CLI returns a preview URL — open it and run an abbreviated smoke test (top 10 items from Task 6) against the **production** store's data.

This catches any production-data issues (e.g. real product images sized differently than dev) before going live.

- [ ] **Step 7.6: Publish the theme**

When the production preview is clean:

```bash
shopify theme push --live
```
The CLI will prompt for confirmation — type `yes`. The theme becomes the live theme on the production store.

Alternative path: admin → **Online store → Themes** → **Clarke By Design v1.0** → **Actions → Publish**.

- [ ] **Step 7.7: Remove the storefront password**

Shopify admin → **Online store → Preferences** → scroll to **Restrict access to visitors with the password** → toggle **off**.

The storefront is now publicly accessible at the custom domain.

- [ ] **Step 7.8: Post-deploy verification (10-minute smoke)**

From an incognito browser window (not logged into Shopify admin), visit the live custom domain. Walk through:

- [ ] Homepage renders, hero LCP < 2.5s
- [ ] Click into a product, complete a real test order via Bogus Gateway (or a real $1 order you'll refund) — confirm order lands in admin, confirmation email arrives at owner's address
- [ ] Open the homepage on a real mobile device — visual check, tap through to product, add to cart, abandon at checkout — confirm abandoned cart email fires (check admin after ~10 min)
- [ ] Submit a custom orders form — confirm draft order created + email received
- [ ] Submit newsletter — confirm subscriber added in admin

If all five pass, the launch is complete.

- [ ] **Step 7.9: Submit sitemap to Google Search Console & Bing Webmaster**

Following Step 5.4's deferred plan:
1. Google Search Console → Add property → enter `https://clarkebydesign.ca` → verify via HTML meta tag (Shopify auto-injects when domain is connected) or DNS TXT record
2. Once verified → Sitemaps → submit `https://clarkebydesign.ca/sitemap.xml`
3. Repeat at Bing Webmaster Tools

- [ ] **Step 7.10: Tag the release**

```bash
git tag v1.0.0-launch -m "Clarke By Design Shopify theme — v1.0 production launch"
git push origin main --tags
```

- [ ] **Step 7.11: Commit anything pending**

```bash
git status
# If clean, you're done. If anything stray:
git add -A
git commit -m "chore(release): finalize v1.0 launch state"
```

---

## Task 8: Owner handoff documentation

Hand the owner the keys. This is a written/admin task, no code.

**Files:** none in repo. Communication artifact is an email or a shared doc — choose whichever the owner prefers.

- [ ] **Step 8.1: Write a one-page owner handoff doc** covering:

1. **How to add a new product** — admin → Products → Add product; set variants for backer color / letter color / add-on; in product metafields set `personalization.fonts` to choose which fonts this product offers (default 3).
2. **How to add a new market** — admin → Content → Metaobjects → Market Event → Add entry.
3. **How to add a featured review** — admin → Content → Metaobjects → Featured Review → Add entry.
4. **How to translate product content into French** — admin → Apps → Translate & Adapt → select French (Canada) → translate per product / page; **publish** French in Settings → Languages once at least the top 20 products are translated.
5. **How to update homepage hero / banner copy** — admin → Online store → Themes → Customize → click each section in the left rail → edit copy.
6. **How to update the local pickup expected time** — admin → Settings → Shipping and delivery → Local pickup → Manage → edit "Expected pickup time".
7. **How to refresh the Instagram strip** — admin → Online store → Themes → Customize → Instagram strip section → swap any of the 6 tile images monthly (or on a seasonal cadence).
8. **How to publish a new theme version after a developer change** — developer pushes a new branch, runs `shopify theme push --unpublished`, owner previews in admin, owner clicks **Publish** when ready.

- [ ] **Step 8.2: Schedule a 30-min walkthrough call** with the owner to demo each of the 8 items live in admin. Record the call for future reference.

- [ ] **Step 8.3: Set up a basic uptime monitor (optional but recommended)**

A free service like UptimeRobot or Better Stack pinging the homepage every 5 min and emailing the owner on downtime. 10 minutes of setup, no code, prevents the owner from finding out about an outage from a customer.

---

## Self-Review Results

**Spec coverage:**

| Spec section | Plan 4 task | Status |
|---|---|---|
| §6.5 Local pickup checkout config | Task 1 (admin + cart drawer notice) | ✓ |
| §7.1 + §1.2 French locale rollout structure | Task 2 (Translate & Adapt + populated `fr.json` theme strings) | ✓ |
| §7.4 Performance budget (Lighthouse ≥ 85, LCP < 2.5s) | Task 3 (preloads, deferred CSS, image audit, JS audit) | ✓ |
| §7.5 Accessibility (WCAG 2.1 AA) | Task 4 (keyboard, focus, alt, contrast, ARIA, screen reader) | ✓ |
| Pre-launch smoke checklist | Task 6 (57 PASS/FAIL items across 11 categories) | ✓ |
| Production deployment (DNS, push, post-deploy) | Task 7 | ✓ |
| Owner handoff | Task 8 | ✓ |

**Not covered (intentionally — out of scope per spec and prior plans):**
- Product / content translation into French (owner work via Translate & Adapt — explicitly called out in Task 2 scope clarification)
- Live SVG personalization preview (spec §5.4, deferred to phase 2)
- Email automation beyond Shopify defaults — Klaviyo / abandoned cart series (spec phase 2)
- Loyalty program (spec phase 2)
- B2B / wholesale (spec phase 3)

**Placeholder scan:**
- Task 3.3 references a specific Google Fonts woff2 URL for Playfair Display semibold. The URL is current as of writing; if Google rotates the file the preload becomes a no-op (no harm done). Step 3.3 includes verification instructions.
- Task 6.48 "test order with Bogus Gateway" assumes Shopify's testing payment gateway is enabled in dev. Owner can swap to a real $1 order on production if preferred.
- Custom domain in Step 7.2 / 7.9 is templated as `clarkebydesign.ca` — owner may choose a different TLD; plan steps are domain-agnostic.

**Consistency checks:**
- Locale key naming (`sections.hero_tiles.eyebrow`, etc.) in `fr.json` matches Plan 1 section IDs (`hero-tiles`, hyphen → underscore for JSON-safe keys). If Plan 1 used a different convention, reconcile during Step 2.2 audit.
- `local-pickup-notice` snippet name matches the Liquid `render` call (Step 1.4 vs 1.7).
- Commit message prefixes align with the brief: `feat(cart)` for the pickup notice (functional addition), `chore(perf)` / `chore(a11y)` / `i18n(fr)` / `chore(release)` for the polish work.
- Tag `v1.0.0-launch` follows the semver release pattern set by Plan 1's `v0.1.0-foundation`.

**Risks flagged for the implementer:**
1. DNS propagation (Step 7.2) can take up to 48 hours for externally registered domains. Schedule launch window with at least 2 business days of buffer.
2. SSL certificate provisioning can fail silently if DNS isn't fully propagated when Shopify attempts issuance. If status stays "Pending" > 24h, contact Shopify support — do not flip the storefront-password off until SSL is **Issued**.
3. Translate & Adapt currently translates theme strings via the locale files we ship — owner does NOT need to touch `locales/fr.json` for theme strings (we pre-translated). Make sure the owner understands the split clearly to avoid duplicate edits.

Plan complete. Ready for execution after Plans 2 and 3 land.
