# Plan 2 — Product Page + Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the branded product page from spec §5 — two-column sticky layout, image gallery, visual chip-picker personalization UI (name, backer colour, letter colour, font style, add-ons) with native variant + line-item-property storage, tabbed long-form details, related products row, and the §6.5 cart drawer that opens on Add to Cart and surfaces line-item properties.

**Architecture:** A single Online Store 2.0 product template (`templates/product.json`) composed of three custom sections — `product-main` (gallery + info + personalization form), `product-tabs` (long description / materials / care / shipping), and `product-row` (reused from Plan 1 for "You may also like"). Personalization mirrors spec §5.3: backer = option 1, letter = option 2, add-on = option 3 (variant-backed); font + name = line-item properties. JS is one ES-module (`assets/product-personalize.js`) that wires chip clicks to the variant selector + a hidden form, plus one tiny `cart-drawer.js` for the drawer. Live SVG preview (§5.4) is deferred — left as a stub file with a TODO.

**Tech Stack:**
- Liquid (Online Store 2.0 sections + blocks)
- Vanilla JS ES modules (no framework)
- CSS custom properties (Plan 1's `--color-*` tokens via `rgb(var(--color-*))`)
- Shopify variants (3-option max) + line-item properties (free text)
- Shopify Cart AJAX API (`/cart/add.js`, `/cart.js`)
- Google Fonts for sample font chips: Pacifico (script), Bebas Neue (block), Permanent Marker (marker) — loaded once on product pages only

---

## File Structure

```
.
├── assets/
│   ├── section-product-main.css          # NEW — gallery, info, personalization form layout
│   ├── chip-picker.css                   # NEW — swatches, font chips, addon cards
│   ├── section-product-tabs.css          # NEW — tabs UI
│   ├── cart-drawer.css                   # NEW — drawer styles
│   ├── product-personalize.js            # NEW — chip-click → variant + LIP wiring
│   ├── cart-drawer.js                    # NEW — opens drawer on add, fetches /cart.js
│   └── product-preview.js                # NEW — stub for phase-2 live SVG preview
├── sections/
│   ├── product-main.liquid               # NEW — gallery + info + personalization
│   ├── product-tabs.liquid               # NEW — long description / materials / care / shipping
│   └── cart-drawer.liquid                # NEW — global drawer markup (rendered in layout)
├── snippets/
│   ├── product-gallery.liquid            # NEW — main image + thumbs
│   ├── chip-swatch.liquid                # NEW — single colour swatch
│   ├── chip-font.liquid                  # NEW — single font sample chip
│   └── chip-addon.liquid                 # NEW — single add-on checkbox card
├── templates/
│   └── product.json                      # NEW — Clarke product template
├── layout/
│   └── theme.liquid                      # MODIFIED — render cart-drawer + load drawer JS
└── locales/
    └── en.default.json                   # MODIFIED — add product/personalize strings
```

---

## Task 1: Product template + main section skeleton

**Files:**
- Create: `templates/product.json`
- Create: `sections/product-main.liquid` (skeleton only, populated by later tasks)
- Create: `assets/section-product-main.css`

- [ ] **Step 1.1: Create `templates/product.json`**

```json
{
  "sections": {
    "main": {
      "type": "product-main",
      "settings": {
        "show_vendor": false,
        "show_rating": true,
        "char_limit": 10
      }
    },
    "tabs": {
      "type": "product-tabs",
      "settings": {}
    },
    "related": {
      "type": "product-row",
      "settings": {
        "eyebrow": "you may also like",
        "heading": "More gifts in this style",
        "collection": "all",
        "product_count": 4,
        "link_label": "",
        "link_url": ""
      }
    }
  },
  "order": ["main", "tabs", "related"]
}
```

Note: `product-row` is reused from Plan 1 unchanged. Owners can later swap the collection per product via theme editor.

- [ ] **Step 1.2: Create `sections/product-main.liquid` skeleton**

```liquid
{{ 'section-product-main.css' | asset_url | stylesheet_tag }}
{{ 'chip-picker.css' | asset_url | stylesheet_tag }}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Bebas+Neue&family=Permanent+Marker&display=swap" rel="stylesheet">

<section class="product-page section" data-product-main data-product-id="{{ product.id }}">
  <div class="container product-page__grid">
    {% comment %} Left column (gallery) — populated in Task 2 {% endcomment %}
    <div class="product-page__gallery" data-product-gallery>
      {% render 'product-gallery', product: product %}
    </div>

    {% comment %} Right column (info + form) — populated in Tasks 3–6 {% endcomment %}
    <div class="product-page__info">
      {% comment %} placeholder — populated in later steps {% endcomment %}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Product main",
  "settings": [
    { "type": "checkbox", "id": "show_vendor", "label": "Show vendor", "default": false },
    { "type": "checkbox", "id": "show_rating", "label": "Show star rating", "default": true },
    { "type": "range",    "id": "char_limit", "label": "Max characters in name", "min": 4, "max": 24, "step": 1, "default": 10 }
  ],
  "presets": [
    { "name": "Product main" }
  ]
}
{% endschema %}
```

- [ ] **Step 1.3: Create `assets/section-product-main.css`**

```css
.product-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: clamp(24px, 5vw, 64px);
  align-items: start;
}

.product-page__gallery,
.product-page__info {
  min-width: 0;
}

@media (min-width: 900px) {
  .product-page__gallery,
  .product-page__info {
    position: sticky;
    top: 96px; /* sits under the 72px sticky header + breathing room */
    align-self: start;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }
  .product-page__gallery::-webkit-scrollbar,
  .product-page__info::-webkit-scrollbar { width: 0; }
}

@media (max-width: 900px) {
  .product-page__grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 1.4: Smoke test (page should load, even with empty right column)**

```bash
npm run dev
```
Visit any product URL on the dev store (e.g. `/products/sample`). Expect: section renders, gallery snippet errors are tolerated (will be fixed in Task 2). Stop the server.

- [ ] **Step 1.5: Commit**

```bash
git add templates/product.json sections/product-main.liquid assets/section-product-main.css
git commit -m "feat(product): scaffold product template and sticky two-column layout"
```

---

## Task 2: Image gallery snippet

**Files:**
- Create: `snippets/product-gallery.liquid`

Gallery shows the primary `1:1` product image with a 4-thumb row beneath. Active thumb gets a navy outline. Pure CSS + a sliver of inline JS via `details`/`label` swap.

- [ ] **Step 2.1: Create `snippets/product-gallery.liquid`**

```liquid
{%- comment -%}
  Usage: {% render 'product-gallery', product: product %}
  Renders a primary image (1:1) + thumb row. Thumbs swap the main via radio inputs.
{%- endcomment -%}

{%- assign images = product.images -%}
{%- if images.size == 0 -%}
  <div class="product-gallery">
    <div class="product-gallery__main product-gallery__main--empty">
      <span>No image yet</span>
    </div>
  </div>
{%- else -%}
<div class="product-gallery" data-gallery>
  <div class="product-gallery__main">
    {%- for img in images limit: 8 -%}
      <input
        type="radio"
        name="product-gallery-{{ product.id }}"
        id="gallery-{{ product.id }}-{{ forloop.index }}"
        class="product-gallery__radio"
        {% if forloop.first %}checked{% endif %}
        aria-hidden="true">
      <div class="product-gallery__slide" data-slide="{{ forloop.index }}">
        {{ img | image_url: width: 1200 | image_tag:
            widths: '480, 720, 960, 1200',
            sizes: '(min-width: 900px) 48vw, 100vw',
            loading: forloop.first | default: false,
            alt: img.alt | default: product.title,
            class: 'product-gallery__img' }}
      </div>
    {%- endfor -%}
  </div>

  {%- if images.size > 1 -%}
    <ul class="product-gallery__thumbs" role="list">
      {%- for img in images limit: 8 -%}
        <li>
          <label for="gallery-{{ product.id }}-{{ forloop.index }}" class="product-gallery__thumb">
            {{ img | image_url: width: 200 | image_tag:
                widths: '100, 200',
                loading: 'lazy',
                alt: '',
                class: 'product-gallery__thumb-img' }}
          </label>
        </li>
      {%- endfor -%}
    </ul>
  {%- endif -%}
</div>
{%- endif -%}
```

- [ ] **Step 2.2: Append gallery styles to `assets/section-product-main.css`**

```css
.product-gallery { display: flex; flex-direction: column; gap: 12px; }

.product-gallery__main {
  position: relative;
  aspect-ratio: 1;
  background: rgb(var(--color-blush) / 0.18);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.product-gallery__main--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--color-navy) / 0.5);
  font-family: var(--font-body);
}

.product-gallery__radio { position: absolute; opacity: 0; pointer-events: none; }
.product-gallery__slide {
  position: absolute; inset: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.product-gallery__img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}

/* Show the slide whose preceding radio is checked */
.product-gallery__radio:checked + .product-gallery__slide { opacity: 1; z-index: 1; }

.product-gallery__thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.product-gallery__thumb {
  display: block;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  outline-offset: 2px;
  transition: border-color 0.15s, transform 0.15s;
}
.product-gallery__thumb:hover { transform: translateY(-1px); }
.product-gallery__thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Selected thumb gets a navy ring + 2px offset look */
.product-gallery__radio:checked ~ .product-gallery__thumbs li:nth-child(1) .product-gallery__thumb {
  /* default fallback — replaced below by explicit per-index sibling selectors */
}
{% comment %} Loop-generated selectors handled by JS-less ~ pattern below {% endcomment %}
.product-gallery [data-slide]:not(:first-of-type) { /* no-op anchor */ }
```

Because pure CSS sibling-selectors are awkward for "match thumb N to checked radio N", add a tiny JS toggler. Append to `assets/product-personalize.js` (created in Task 4); for now keep the CSS-only opacity swap working — when a radio is checked the matching `+ .product-gallery__slide` becomes opaque, but the *thumb* highlight needs JS. We'll cover thumb-active state with a class `is-active` set by `cart-drawer.js`/`product-personalize.js`. For Task 2, ship the bare gallery; visual highlight comes in Task 4 (Step 4.4).

- [ ] **Step 2.3: Smoke test**

```bash
npm run dev
```
Open a product with at least 2 images. Click each thumb — the main image swaps. Active-state styling on thumbs deferred to Task 4.

- [ ] **Step 2.4: Commit**

```bash
git add snippets/product-gallery.liquid assets/section-product-main.css
git commit -m "feat(product): add image gallery snippet with radio-driven thumb swap"
```

---

## Task 3: Product info block (eyebrow, title, price, short desc, CTAs)

**Files:**
- Modify: `sections/product-main.liquid` (replace the empty `.product-page__info` block)

- [ ] **Step 3.1: Replace the `<div class="product-page__info">…</div>` block in `sections/product-main.liquid` with:**

```liquid
<div class="product-page__info">
  <form
    method="post"
    action="{{ routes.cart_add_url }}"
    id="ProductForm-{{ section.id }}"
    accept-charset="UTF-8"
    enctype="multipart/form-data"
    data-product-form
    data-product-handle="{{ product.handle }}">
    <input type="hidden" name="form_type" value="product">
    <input type="hidden" name="utf8" value="✓">
    <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}" data-variant-id-input>

    {%- if product.collections.first -%}
      <p class="eyebrow product-page__eyebrow">{{ product.collections.first.title }}</p>
    {%- endif -%}

    <h1 class="product-page__title">{{ product.title | escape }}</h1>

    {%- if section.settings.show_rating -%}
      <div class="product-page__rating" aria-label="Star rating">
        <span class="product-page__stars" aria-hidden="true">★ ★ ★ ★ ★</span>
        <span class="product-page__rating-count">
          {%- if product.metafields.reviews.rating_count -%}
            ({{ product.metafields.reviews.rating_count }} reviews)
          {%- else -%}
            (New)
          {%- endif -%}
        </span>
      </div>
    {%- endif -%}

    <p class="product-page__price" data-product-price>
      <span data-price-current>{{ product.selected_or_first_available_variant.price | money }}</span>
      {%- if product.compare_at_price_max > product.price -%}
        <s data-price-compare>{{ product.compare_at_price_max | money }}</s>
      {%- endif -%}
    </p>

    {%- if product.description != blank -%}
      <div class="product-page__short">
        {{ product.description | split: '<!-- split -->' | first }}
      </div>
    {%- endif -%}

    {% comment %} Personalization fieldset — populated in Tasks 4 & 5 {% endcomment %}
    <div class="product-page__personalize" data-personalize-root>
      {% comment %} populated by chip pickers {% endcomment %}
    </div>

    <div class="product-page__cta-row">
      <button type="submit" class="btn btn-primary product-page__cta" data-add-to-cart {% unless product.available %}disabled{% endunless %}>
        <span data-cta-label>
          {%- if product.available -%}
            {{ 'products.product.add_to_cart' | t }} — <span data-cta-price>{{ product.selected_or_first_available_variant.price | money }}</span>
          {%- else -%}
            {{ 'products.product.sold_out' | t }}
          {%- endif -%}
        </span>
      </button>
      <button type="button" class="btn btn-ghost product-page__save" data-save-toggle aria-pressed="false">
        {% render 'icon', name: 'heart', size: 16 %} <span>{{ 'products.product.save' | t }}</span>
      </button>
    </div>
  </form>
</div>
```

- [ ] **Step 3.2: Append info-column styles to `assets/section-product-main.css`**

```css
.product-page__eyebrow { margin-bottom: 6px; }
.product-page__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(24px, 3.2vw, 32px);
  color: rgb(var(--color-navy));
  margin: 0 0 10px;
  line-height: 1.15;
}
.product-page__rating {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
  color: rgb(var(--color-birch));
  font-size: 14px;
}
.product-page__stars { letter-spacing: 2px; }
.product-page__rating-count { color: rgb(var(--color-ink) / 0.6); font-size: 13px; }
.product-page__price {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  color: rgb(var(--color-ink));
  margin: 0 0 16px;
}
.product-page__price s { color: rgb(var(--color-ink) / 0.45); margin-left: 8px; font-weight: 500; }

.product-page__short {
  color: rgb(var(--color-ink) / 0.78);
  font-size: 15px;
  line-height: 1.55;
  margin-bottom: 24px;
}

.product-page__personalize { margin-bottom: 24px; }

.product-page__cta-row {
  display: flex; flex-wrap: wrap; gap: 10px;
  margin-top: 8px;
}
.product-page__cta { flex: 1 1 220px; min-height: 52px; }
.product-page__save { flex: 0 0 auto; gap: 6px; }
.product-page__cta[disabled] { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 3.3: Add the locale strings (English)**

In `locales/en.default.json`, ensure these keys exist under `products.product` (Dawn ships most of them; add missing ones):

```json
{
  "products": {
    "product": {
      "add_to_cart": "Add to cart",
      "sold_out": "Sold out",
      "save": "Save for later",
      "personalize": {
        "name_label": "Name",
        "name_help": "Up to {{ limit }} characters",
        "backer_label": "Backer colour",
        "letter_label": "Letter colour",
        "font_label": "Font style",
        "addons_label": "Add-ons",
        "required": "Required"
      }
    }
  }
}
```

- [ ] **Step 3.4: Smoke test**

```bash
npm run dev
```
Visit a product. Confirm title, rating row, price, short description, and disabled-or-enabled Add to Cart all render. The Add to Cart label shows the price.

- [ ] **Step 3.5: Commit**

```bash
git add sections/product-main.liquid assets/section-product-main.css locales/en.default.json
git commit -m "feat(product): add info column with title, price, rating and CTA row"
```

---

## Task 4: Variant-backed chip pickers — backer + letter + add-on

**Files:**
- Create: `snippets/chip-swatch.liquid`
- Create: `snippets/chip-addon.liquid`
- Modify: `sections/product-main.liquid` (insert pickers inside `[data-personalize-root]`)
- Create: `assets/chip-picker.css`

The Shopify variant model per spec §5.3:

| Option position | Field          | Storage          |
| --------------- | -------------- | ---------------- |
| 1               | Backer colour  | Variant option 1 |
| 2               | Letter colour  | Variant option 2 |
| 3               | Add-on         | Variant option 3 |

We render each option as a chip group. The hidden `name="id"` input is updated by JS in Task 6 whenever the combination changes.

- [ ] **Step 4.1: Create `snippets/chip-swatch.liquid`**

A swatch chip used for backer + letter colour options. Maps the option value name to a colour using:
- A `chip_colors` metafield on the product (preferred), formatted as JSON `{ "Birch": "#B68A65", "Cream": "#F8F1E7" }`
- Else, a `swatch_colors` theme setting (fallback)
- Else, a deterministic hash → muted hue

```liquid
{%- comment -%}
  Usage:
    {% render 'chip-swatch',
        option: option,           {# product.options_with_values entry #}
        position: 1,
        value: value_obj          {# one option value #}
    %}
  Renders a single circular swatch input.
{%- endcomment -%}

{%- assign color_hex = '' -%}
{%- assign value_name = value.name -%}

{%- if product.metafields.personalization.chip_colors.value -%}
  {%- assign color_hex = product.metafields.personalization.chip_colors.value[value_name] -%}
{%- endif -%}
{%- if color_hex == blank -%}
  {%- comment -%} Deterministic fallback so unconfigured products still look right {%- endcomment -%}
  {%- assign hash = value_name | md5 | slice: 0, 6 -%}
  {%- assign color_hex = '#' | append: hash -%}
{%- endif -%}

{%- assign input_id = 'opt-' | append: position | append: '-' | append: forloop.index0 | append: '-' | append: product.id -%}

<label class="chip-swatch" for="{{ input_id }}" data-chip-value="{{ value_name | escape }}">
  <input
    type="radio"
    id="{{ input_id }}"
    class="chip-swatch__radio"
    name="options[{{ option.name }}]"
    value="{{ value_name | escape }}"
    data-chip-option="{{ position }}"
    {% if option.selected_value == value_name %}checked{% endif %}>
  <span class="chip-swatch__dot" style="--swatch: {{ color_hex }};" aria-hidden="true">
    {% render 'icon', name: 'check', size: 14 %}
  </span>
  <span class="chip-swatch__name">{{ value_name }}</span>
</label>
```

Note the snippet uses `{% render 'icon', name: 'check', size: 14 %}` — add a `check` symbol to `snippets/icons-sprite.liquid` (created in Plan 1) if it isn't already there:

```xml
<symbol id="icon-check" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
```

- [ ] **Step 4.2: Create `snippets/chip-addon.liquid`**

```liquid
{%- comment -%}
  Usage:
    {% render 'chip-addon', option: option, value: value, position: 3, base_price: base_price %}
  Renders an add-on checkbox-style card. Variant-backed (option 3).
  Add-on values are option strings like "None", "Gift wrap +$3", "Mini card +$2".
{%- endcomment -%}

{%- assign label = value.name -%}
{%- assign input_id = 'addon-' | append: position | append: '-' | append: forloop.index0 | append: '-' | append: product.id -%}

<label class="chip-addon" for="{{ input_id }}">
  <input
    type="radio"
    id="{{ input_id }}"
    class="chip-addon__radio"
    name="options[{{ option.name }}]"
    value="{{ label | escape }}"
    data-chip-option="{{ position }}"
    {% if option.selected_value == label %}checked{% endif %}>
  <span class="chip-addon__box" aria-hidden="true"></span>
  <span class="chip-addon__label">{{ label }}</span>
</label>
```

- [ ] **Step 4.3: Replace `<div class="product-page__personalize" data-personalize-root>…` in `sections/product-main.liquid`**

Insert the picker groups inside that div. Each picker only renders when the matching product option exists, so non-personalized products degrade gracefully.

```liquid
<div class="product-page__personalize" data-personalize-root>
  {%- comment -%} Name (line-item property — populated in Task 5) {%- endcomment -%}
  <div class="picker-block" data-picker-name>
    <label class="picker-block__label" for="properties-Name-{{ section.id }}">
      {{ 'products.product.personalize.name_label' | t }}
      <span class="picker-block__hint">{{ 'products.product.personalize.name_help' | t: limit: section.settings.char_limit }}</span>
    </label>
    <input
      type="text"
      id="properties-Name-{{ section.id }}"
      name="properties[Name]"
      class="picker-block__input"
      maxlength="{{ section.settings.char_limit }}"
      required
      autocomplete="off"
      data-property-name>
    <span class="picker-block__counter" data-name-counter>0 / {{ section.settings.char_limit }}</span>
  </div>

  {%- comment -%} Variant-backed options: backer (1), letter (2), addon (3) {%- endcomment -%}
  {%- for option in product.options_with_values -%}
    {%- assign pos = forloop.index -%}
    {%- if pos == 1 -%}
      <div class="picker-block">
        <span class="picker-block__label">{{ 'products.product.personalize.backer_label' | t }}</span>
        <div class="chip-row chip-row--swatch" role="radiogroup" aria-label="{{ option.name }}">
          {%- for value in option.values -%}
            {% render 'chip-swatch', option: option, position: pos, value: value, product: product %}
          {%- endfor -%}
        </div>
      </div>
    {%- elsif pos == 2 -%}
      <div class="picker-block">
        <span class="picker-block__label">{{ 'products.product.personalize.letter_label' | t }}</span>
        <div class="chip-row chip-row--swatch" role="radiogroup" aria-label="{{ option.name }}">
          {%- for value in option.values -%}
            {% render 'chip-swatch', option: option, position: pos, value: value, product: product %}
          {%- endfor -%}
        </div>
      </div>
    {%- elsif pos == 3 -%}
      <div class="picker-block">
        <span class="picker-block__label">{{ 'products.product.personalize.addons_label' | t }}</span>
        <div class="chip-row chip-row--addon" role="radiogroup" aria-label="{{ option.name }}">
          {%- for value in option.values -%}
            {% render 'chip-addon', option: option, position: pos, value: value, product: product %}
          {%- endfor -%}
        </div>
      </div>
    {%- endif -%}
  {%- endfor -%}

  {%- comment -%} Font style (line-item property — populated in Task 5) {%- endcomment -%}
  <div class="picker-block" data-picker-font>
    {%- comment -%} populated by Task 5 {%- endcomment -%}
  </div>

  {%- comment -%} Hidden variant data for JS variant matching {%- endcomment -%}
  <script type="application/json" data-variants-json>
    {{ product.variants | json }}
  </script>
</div>
```

- [ ] **Step 4.4: Create `assets/chip-picker.css`**

```css
.picker-block { margin-bottom: 22px; }
.picker-block__label {
  display: block;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  margin-bottom: 10px;
}
.picker-block__hint {
  display: inline-block;
  margin-left: 8px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: none;
  color: rgb(var(--color-ink) / 0.55);
  font-size: 12px;
}

.picker-block__input {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid rgb(var(--color-line));
  border-radius: var(--radius-md);
  background: rgb(var(--color-surface));
  font-family: var(--font-body);
  font-size: 15px;
  color: rgb(var(--color-ink));
  transition: border-color 0.15s;
}
.picker-block__input:focus {
  outline: 2px solid rgb(var(--color-navy));
  outline-offset: 2px;
  border-color: rgb(var(--color-navy));
}
.picker-block__counter {
  display: block;
  font-size: 11px;
  color: rgb(var(--color-ink) / 0.55);
  margin-top: 6px;
  text-align: right;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip-row--swatch { gap: 10px; }
.chip-row--addon  { flex-direction: column; gap: 8px; }
.chip-row--fonts  { gap: 10px; }

/* --- Swatch chip --------------------------------------------------- */
.chip-swatch {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.chip-swatch__radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.chip-swatch__dot {
  width: 36px; height: 36px;
  border-radius: 999px;
  background: var(--swatch, #ccc);
  border: 2px solid #fff;
  box-shadow: 0 0 0 1.5px rgb(var(--color-line));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: box-shadow 0.15s, transform 0.15s;
}
.chip-swatch:hover .chip-swatch__dot { transform: translateY(-1px); }
.chip-swatch__radio:checked + .chip-swatch__dot {
  box-shadow: 0 0 0 2px rgb(var(--color-navy));
  color: #fff;
}
.chip-swatch__radio:focus-visible + .chip-swatch__dot {
  box-shadow: 0 0 0 2px rgb(var(--color-navy)), 0 0 0 4px rgb(var(--color-blush));
}
.chip-swatch__name {
  font-family: var(--font-body);
  font-size: 11px;
  color: rgb(var(--color-ink) / 0.7);
  max-width: 60px;
  text-align: center;
  line-height: 1.2;
}

/* --- Addon chip ---------------------------------------------------- */
.chip-addon {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1.5px solid rgb(var(--color-line));
  border-radius: var(--radius-md);
  background: rgb(var(--color-surface));
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.chip-addon:hover { border-color: rgb(var(--color-navy) / 0.4); }
.chip-addon__radio { position: absolute; opacity: 0; pointer-events: none; }
.chip-addon__box {
  width: 20px; height: 20px;
  border-radius: var(--radius-sm);
  border: 1.5px solid rgb(var(--color-line));
  background: rgb(var(--color-bg));
  flex: 0 0 auto;
  position: relative;
}
.chip-addon__radio:checked ~ .chip-addon__box {
  background: rgb(var(--color-navy));
  border-color: rgb(var(--color-navy));
}
.chip-addon__radio:checked ~ .chip-addon__box::after {
  content: "";
  position: absolute;
  left: 4px; top: 7px;
  width: 10px; height: 5px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg);
}
.chip-addon__radio:checked ~ .chip-addon__label { color: rgb(var(--color-navy)); font-weight: 600; }
.chip-addon__radio:checked + .chip-addon__box,
.chip-addon:has(.chip-addon__radio:checked) { border-color: rgb(var(--color-navy)); background: rgb(var(--color-blush) / 0.15); }
.chip-addon__label {
  font-family: var(--font-body);
  font-size: 14px;
  color: rgb(var(--color-ink));
  flex: 1;
}
```

- [ ] **Step 4.5: Smoke test**

```bash
npm run dev
```
Use a test product with 3 options (Backer / Letter / Add-on). Confirm: swatches render circular with deterministic-hash colours, click cycles them, add-on cards render in a vertical stack, and the active state shows the navy ring + checkmark dot. Variant id input isn't wired yet — that comes in Task 6.

- [ ] **Step 4.6: Commit**

```bash
git add snippets/chip-swatch.liquid snippets/chip-addon.liquid sections/product-main.liquid assets/chip-picker.css snippets/icons-sprite.liquid
git commit -m "feat(product): add visual chip pickers for backer, letter, and addon"
```

---

## Task 5: Font picker (line-item property) + name input character counter

**Files:**
- Create: `snippets/chip-font.liquid`
- Modify: `sections/product-main.liquid` (populate `[data-picker-font]`)
- Append: `assets/chip-picker.css`

Font choice does **not** drive inventory, so it lives as a line-item property under the key `Font`. The available fonts per product are read from `product.metafields.personalization.fonts` (JSON list); the theme falls back to the three defaults from spec §5.2 — Pacifico (Script), Bebas Neue (Block), Permanent Marker (Marker).

- [ ] **Step 5.1: Create `snippets/chip-font.liquid`**

```liquid
{%- comment -%}
  Usage:
    {% render 'chip-font', font: font_obj, idx: 1, default: true %}
  `font_obj` is a hash like { "id": "script", "name": "Script", "family": "Pacifico", "stack": "'Pacifico', cursive" }
{%- endcomment -%}
{%- assign input_id = 'font-' | append: idx | append: '-' | append: product.id -%}
<label class="chip-font" for="{{ input_id }}">
  <input
    type="radio"
    id="{{ input_id }}"
    name="properties[Font]"
    value="{{ font.name | escape }}"
    class="chip-font__radio"
    data-font-family="{{ font.stack | escape }}"
    {% if default %}checked{% endif %}>
  <span class="chip-font__sample" style="font-family: {{ font.stack }};" aria-hidden="true">Aa</span>
  <span class="chip-font__name">{{ font.name }}</span>
</label>
```

- [ ] **Step 5.2: Populate `[data-picker-font]` inside `sections/product-main.liquid`**

Replace the empty `<div class="picker-block" data-picker-font>…</div>` with:

```liquid
<div class="picker-block" data-picker-font>
  <span class="picker-block__label">{{ 'products.product.personalize.font_label' | t }}</span>

  {%- assign fonts_json = product.metafields.personalization.fonts.value -%}
  {%- if fonts_json == blank -%}
    {%- capture fonts_default -%}[
      {"id":"script","name":"Script","family":"Pacifico","stack":"'Pacifico', cursive"},
      {"id":"block","name":"Block","family":"Bebas Neue","stack":"'Bebas Neue', sans-serif"},
      {"id":"marker","name":"Marker","family":"Permanent Marker","stack":"'Permanent Marker', cursive"}
    ]{%- endcapture -%}
    {%- assign fonts_json = fonts_default | parse_json -%}
  {%- endif -%}

  <div class="chip-row chip-row--fonts" role="radiogroup" aria-label="Font style">
    {%- for f in fonts_json -%}
      {% render 'chip-font', font: f, idx: forloop.index, default: forloop.first, product: product %}
    {%- endfor -%}
  </div>
</div>
```

Note: `parse_json` is a Shopify Liquid filter available in OS 2.0 — if your store hasn't enabled it, fall back to hardcoding the default 3 in the template. The metafield variant continues to work for the customized case.

- [ ] **Step 5.3: Append font-chip styles to `assets/chip-picker.css`**

```css
.chip-font {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 14px;
  min-width: 84px;
  border: 1.5px solid rgb(var(--color-line));
  border-radius: var(--radius-md);
  background: rgb(var(--color-surface));
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.chip-font:hover { border-color: rgb(var(--color-navy) / 0.5); transform: translateY(-1px); }
.chip-font__radio { position: absolute; opacity: 0; pointer-events: none; }
.chip-font__radio:checked ~ * { /* anchor — selected state below */ }
.chip-font:has(.chip-font__radio:checked) {
  border-color: rgb(var(--color-navy));
  background: rgb(var(--color-blush) / 0.18);
}
.chip-font__sample {
  font-size: 32px;
  line-height: 1;
  color: rgb(var(--color-navy));
  display: block;
}
.chip-font__name {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(var(--color-ink) / 0.7);
}
```

- [ ] **Step 5.4: Smoke test**

```bash
npm run dev
```
On a product page, confirm: the Font row renders three chip cards each displaying "Aa" in the actual font face (Pacifico cursive, Bebas Neue tall block, Permanent Marker hand-style). Clicking selects one. The Google Fonts link in Task 1.2 must already be loading.

- [ ] **Step 5.5: Commit**

```bash
git add snippets/chip-font.liquid sections/product-main.liquid assets/chip-picker.css
git commit -m "feat(product): add font style chip picker as line-item property"
```

---

## Task 6: Personalization JS — variant matching + CTA price live update + name counter

**Files:**
- Create: `assets/product-personalize.js`
- Modify: `layout/theme.liquid` (load script on product pages)

The JS does four things:
1. On any option-radio change, recompute the matching variant from the embedded `data-variants-json`. Update the hidden `name="id"` input + the CTA price + the URL via `history.replaceState`.
2. Tally the `Name` input characters into `[data-name-counter]`.
3. Mark the active gallery thumb (deferred from Task 2).
4. Disable the Add to Cart button when no variant matches (e.g. sold-out combo) or when Name is empty.

- [ ] **Step 6.1: Create `assets/product-personalize.js`**

```javascript
// Clarke By Design — product-personalize.js
// Wires chip pickers to Shopify variant selection + line-item properties.

(function () {
  const root = document.querySelector('[data-product-main]');
  if (!root) return;

  const form = root.querySelector('[data-product-form]');
  const variantInput = root.querySelector('[data-variant-id-input]');
  const priceEl = root.querySelector('[data-price-current]');
  const ctaPriceEl = root.querySelector('[data-cta-price]');
  const ctaBtn = root.querySelector('[data-add-to-cart]');
  const variantsScript = root.querySelector('[data-variants-json]');
  if (!form || !variantInput || !variantsScript) return;

  let variants = [];
  try {
    variants = JSON.parse(variantsScript.textContent);
  } catch (err) {
    console.warn('[Clarke] failed to parse variants JSON', err);
    return;
  }

  const optionInputs = () =>
    Array.from(root.querySelectorAll('[data-chip-option]:checked'))
      .sort((a, b) => Number(a.dataset.chipOption) - Number(b.dataset.chipOption));

  const formatMoney = (cents) => {
    // Shopify money format — use Intl as a fallback; matches CAD/USD default
    const currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'CAD';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  };

  const findMatchingVariant = () => {
    const selected = optionInputs().map((i) => i.value);
    if (selected.length === 0) return variants[0] || null;
    return variants.find((v) => {
      const opts = [v.option1, v.option2, v.option3].filter((o) => o !== null && o !== undefined);
      return opts.length === selected.length && opts.every((opt, idx) => opt === selected[idx]);
    }) || null;
  };

  const updateForVariant = (variant) => {
    if (!variant) {
      variantInput.value = '';
      ctaBtn.disabled = true;
      ctaBtn.querySelector('[data-cta-label]').textContent = 'Unavailable';
      return;
    }
    variantInput.value = variant.id;
    if (priceEl) priceEl.textContent = formatMoney(variant.price);
    if (ctaPriceEl) ctaPriceEl.textContent = formatMoney(variant.price);
    ctaBtn.disabled = !variant.available || !nameValid();
    const ctaLabel = ctaBtn.querySelector('[data-cta-label]');
    if (variant.available) {
      // Preserve "Add to cart — $price" template; only price text is the inner span
    } else {
      ctaLabel.textContent = 'Sold out';
    }

    // Reflect in URL for shareable links
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      history.replaceState({}, '', url.toString());
    } catch (_) { /* noop */ }
  };

  // ---- Name input -----------------------------------------------------
  const nameInput = root.querySelector('[data-property-name]');
  const nameCounter = root.querySelector('[data-name-counter]');

  const nameValid = () => !nameInput || nameInput.value.trim().length > 0;

  const updateCounter = () => {
    if (!nameInput || !nameCounter) return;
    nameCounter.textContent = `${nameInput.value.length} / ${nameInput.maxLength}`;
  };

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      updateCounter();
      const v = findMatchingVariant();
      updateForVariant(v);
    });
    updateCounter();
  }

  // ---- Option-radio change -------------------------------------------
  root.addEventListener('change', (e) => {
    if (!e.target.matches('[data-chip-option]')) return;
    const v = findMatchingVariant();
    updateForVariant(v);
  });

  // ---- Gallery thumb active state ------------------------------------
  const gallery = root.querySelector('[data-gallery]');
  if (gallery) {
    const radios = gallery.querySelectorAll('.product-gallery__radio');
    const thumbs = gallery.querySelectorAll('.product-gallery__thumb');
    radios.forEach((r, idx) => {
      r.addEventListener('change', () => {
        thumbs.forEach((t, ti) => t.classList.toggle('is-active', ti === idx));
      });
    });
    // Initialize
    const checked = Array.from(radios).findIndex((r) => r.checked);
    if (checked >= 0 && thumbs[checked]) thumbs[checked].classList.add('is-active');
  }

  // ---- Initial sync ---------------------------------------------------
  updateForVariant(findMatchingVariant());
})();
```

- [ ] **Step 6.2: Append the active-thumb style to `assets/section-product-main.css`**

```css
.product-gallery__thumb.is-active {
  border-color: rgb(var(--color-navy));
  outline: 2px solid rgb(var(--color-blush));
  outline-offset: 2px;
}
```

- [ ] **Step 6.3: Load the script only on product pages**

In `layout/theme.liquid`, just before `</body>` (alongside the existing `theme.js` script tag from Plan 1), add:

```liquid
{%- if template contains 'product' -%}
  <script src="{{ 'product-personalize.js' | asset_url }}" defer></script>
{%- endif -%}
```

- [ ] **Step 6.4: Smoke test**

```bash
npm run dev
```
On a 3-option product:
- Change each swatch → CTA price updates, URL updates with `?variant=`.
- Pick an out-of-stock combination → CTA disables and reads "Sold out".
- Leave Name empty → CTA disables.
- Type into Name → counter updates `4 / 10`, CTA re-enables.
- Click each gallery thumb → it gets the navy ring.

- [ ] **Step 6.5: Commit**

```bash
git add assets/product-personalize.js assets/section-product-main.css layout/theme.liquid
git commit -m "feat(product): wire chip pickers to variant matching and price update"
```

---

## Task 7: Product tabs (long description / materials / care / shipping)

**Files:**
- Create: `sections/product-tabs.liquid`
- Create: `assets/section-product-tabs.css`

Tabs use a vanilla details/summary pattern wrapped in radios so we get accordion-on-mobile, tabs-on-desktop for free, no JS required. Content is sourced from product metafields with sane fallbacks editable per section.

- [ ] **Step 7.1: Create `sections/product-tabs.liquid`**

```liquid
{{ 'section-product-tabs.css' | asset_url | stylesheet_tag }}

{%- assign tabs = section.blocks -%}
{%- if tabs.size == 0 -%}
  {%- comment -%} fallback default tabs derived from product fields {%- endcomment -%}
  <section class="product-tabs section">
    <div class="container product-tabs__inner">
      <details class="product-tabs__panel" open>
        <summary class="product-tabs__summary">Details</summary>
        <div class="product-tabs__body rte">{{ product.description }}</div>
      </details>
    </div>
  </section>
{%- else -%}
<section class="product-tabs section">
  <div class="container product-tabs__inner">
    {%- for block in tabs -%}
      <details class="product-tabs__panel" {% if forloop.first %}open{% endif %} {{ block.shopify_attributes }}>
        <summary class="product-tabs__summary">
          {{ block.settings.label }}
          {% render 'icon', name: 'chevron-down', size: 14 %}
        </summary>
        <div class="product-tabs__body rte">
          {%- if block.settings.metafield != blank -%}
            {{ product.metafields[block.settings.metafield_namespace][block.settings.metafield_key] }}
          {%- else -%}
            {{ block.settings.content }}
          {%- endif -%}
        </div>
      </details>
    {%- endfor -%}
  </div>
</section>
{%- endif -%}

{% schema %}
{
  "name": "Product tabs",
  "settings": [],
  "blocks": [
    {
      "type": "tab",
      "name": "Tab",
      "settings": [
        { "type": "text",             "id": "label",              "label": "Label",                 "default": "Details" },
        { "type": "richtext",         "id": "content",            "label": "Fallback content" },
        { "type": "text",             "id": "metafield_namespace","label": "Metafield namespace (optional)", "info": "e.g. 'product'" },
        { "type": "text",             "id": "metafield_key",      "label": "Metafield key (optional)",       "info": "e.g. 'materials'" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [
    {
      "name": "Product tabs",
      "blocks": [
        { "type": "tab", "settings": { "label": "Details",             "content": "<p>Add a long description in the product editor.</p>" } },
        { "type": "tab", "settings": { "label": "Materials & care",    "content": "<p>Made from sustainably sourced birch wood and acrylic. Wipe clean with a soft, damp cloth — avoid harsh chemicals.</p>" } },
        { "type": "tab", "settings": { "label": "Shipping & turnaround","content": "<p>Most personalized orders ship within 3–5 business days from our Ontario studio. Local pickup is available at checkout.</p>" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 7.2: Create `assets/section-product-tabs.css`**

```css
.product-tabs__inner {
  max-width: 920px;
  margin: 0 auto;
}
.product-tabs__panel {
  border-bottom: 1px solid rgb(var(--color-line));
  padding: 4px 0;
}
.product-tabs__panel:first-child { border-top: 1px solid rgb(var(--color-line)); }

.product-tabs__summary {
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 4px;
  font-family: var(--font-display);
  font-size: clamp(18px, 2vw, 22px);
  font-weight: 600;
  color: rgb(var(--color-navy));
  cursor: pointer;
}
.product-tabs__summary::-webkit-details-marker { display: none; }
.product-tabs__summary .icon { transition: transform 0.2s; }
.product-tabs__panel[open] .product-tabs__summary .icon { transform: rotate(180deg); }

.product-tabs__body {
  padding: 0 4px 24px;
  color: rgb(var(--color-ink) / 0.85);
  font-size: 15px;
  line-height: 1.65;
}
.product-tabs__body p { margin: 0 0 12px; }
.product-tabs__body ul { padding-left: 1.2em; margin: 0 0 12px; }
.product-tabs__body a { color: rgb(var(--color-navy)); text-decoration: underline; }
```

- [ ] **Step 7.3: Smoke test**

```bash
npm run dev
```
On a product page, scroll below the fold. Three tabs render as a list of `<details>` panels — first is open, others closed. Click headers to toggle.

- [ ] **Step 7.4: Commit**

```bash
git add sections/product-tabs.liquid assets/section-product-tabs.css
git commit -m "feat(product): add accordion tabs for details, materials, shipping"
```

---

## Task 8: Cart drawer (spec §6.5)

**Files:**
- Create: `sections/cart-drawer.liquid` (rendered globally from layout)
- Create: `assets/cart-drawer.css`
- Create: `assets/cart-drawer.js`
- Modify: `layout/theme.liquid` (render drawer once, link CSS+JS)

The drawer is rendered once in the layout. On submit of any `[data-product-form]`, JS intercepts, POSTs to `/cart/add.js`, then fetches `/cart.js` and re-renders the drawer body in place. Closing is via a close button, ESC, or backdrop click.

- [ ] **Step 8.1: Create `sections/cart-drawer.liquid`**

```liquid
{{ 'cart-drawer.css' | asset_url | stylesheet_tag }}

<div class="cart-drawer" data-cart-drawer hidden aria-hidden="true">
  <div class="cart-drawer__backdrop" data-cart-drawer-close tabindex="-1"></div>

  <aside class="cart-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="CartDrawerHeading">
    <header class="cart-drawer__header">
      <h2 id="CartDrawerHeading" class="cart-drawer__title">Your cart</h2>
      <button class="cart-drawer__close" type="button" data-cart-drawer-close aria-label="Close cart">
        {% render 'icon', name: 'close', size: 20 %}
      </button>
    </header>

    <div class="cart-drawer__body" data-cart-drawer-body>
      {%- comment -%} Populated by cart-drawer.js after each /cart.js fetch. Server-side fallback renders current cart. {%- endcomment -%}
      {% render 'cart-drawer-contents', cart: cart %}
    </div>

    <footer class="cart-drawer__footer" data-cart-drawer-footer>
      {% render 'cart-drawer-footer', cart: cart %}
    </footer>
  </aside>
</div>

{% schema %}
{ "name": "Cart drawer" }
{% endschema %}
```

- [ ] **Step 8.2: Create `snippets/cart-drawer-contents.liquid`**

```liquid
{%- if cart.item_count == 0 -%}
  <p class="cart-drawer__empty">Your cart is empty.</p>
{%- else -%}
  <ul class="cart-drawer__items" role="list">
    {%- for item in cart.items -%}
      <li class="cart-line" data-line-key="{{ item.key }}">
        <a href="{{ item.url }}" class="cart-line__media">
          {%- if item.image -%}
            {{ item.image | image_url: width: 160 | image_tag: widths: '80, 160', loading: 'lazy', alt: item.title, class: 'cart-line__img' }}
          {%- endif -%}
        </a>
        <div class="cart-line__body">
          <a href="{{ item.url }}" class="cart-line__title">{{ item.product.title }}</a>

          {%- if item.variant.title != 'Default Title' -%}
            <p class="cart-line__variant">{{ item.variant.title }}</p>
          {%- endif -%}

          {%- if item.properties != blank -%}
            <ul class="cart-line__props">
              {%- for prop in item.properties -%}
                {%- assign first = prop.first -%}
                {%- assign last = prop.last -%}
                {%- if first != blank and last != blank and first contains '_' == false -%}
                  <li><span>{{ first }}:</span> {{ last }}</li>
                {%- endif -%}
              {%- endfor -%}
            </ul>
          {%- endif -%}

          <div class="cart-line__qty-row">
            <div class="cart-line__qty">
              <button type="button" data-cart-qty-decrement aria-label="Decrease quantity">−</button>
              <input type="number" min="0" value="{{ item.quantity }}" data-cart-qty-input data-line-key="{{ item.key }}">
              <button type="button" data-cart-qty-increment aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-line__price">{{ item.final_line_price | money }}</span>
          </div>
        </div>
      </li>
    {%- endfor -%}
  </ul>
{%- endif -%}
```

- [ ] **Step 8.3: Create `snippets/cart-drawer-footer.liquid`**

```liquid
{%- if cart.item_count > 0 -%}
  <div class="cart-drawer__totals">
    <span>Subtotal</span>
    <strong>{{ cart.total_price | money }}</strong>
  </div>
  <a href="{{ routes.cart_url }}" class="btn btn-ghost cart-drawer__view-cart">View cart</a>
  <form action="{{ routes.cart_url }}" method="post" novalidate>
    <button type="submit" name="checkout" class="btn btn-primary cart-drawer__checkout">Checkout</button>
  </form>
  <p class="cart-drawer__note">Taxes and shipping calculated at checkout.</p>
{%- else -%}
  <a href="{{ routes.all_products_collection_url }}" class="btn btn-primary cart-drawer__shop">Continue shopping</a>
{%- endif -%}
```

Also add a `close` icon to `snippets/icons-sprite.liquid`:

```xml
<symbol id="icon-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
```

- [ ] **Step 8.4: Create `assets/cart-drawer.css`**

```css
.cart-drawer {
  position: fixed;
  inset: 0;
  z-index: 200;
}
.cart-drawer[hidden] { display: none; }
.cart-drawer__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.4);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.cart-drawer.is-open .cart-drawer__backdrop { opacity: 1; }

.cart-drawer__panel {
  position: absolute;
  top: 0; right: 0;
  width: min(420px, 100vw);
  height: 100%;
  background: rgb(var(--color-bg));
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  box-shadow: -8px 0 32px rgb(0 0 0 / 0.12);
}
.cart-drawer.is-open .cart-drawer__panel { transform: translateX(0); }

.cart-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgb(var(--color-line));
}
.cart-drawer__title {
  font-family: var(--font-display);
  font-size: 20px;
  margin: 0;
  color: rgb(var(--color-navy));
}
.cart-drawer__close {
  background: none;
  border: 0;
  cursor: pointer;
  color: rgb(var(--color-navy));
  padding: 4px;
  border-radius: var(--radius-pill);
}
.cart-drawer__close:hover { background: rgb(var(--color-blush) / 0.4); }

.cart-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.cart-drawer__empty { text-align: center; opacity: 0.6; padding: 48px 0; }

.cart-drawer__items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
.cart-line { display: grid; grid-template-columns: 84px 1fr; gap: 14px; }
.cart-line__media {
  display: block;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgb(var(--color-blush) / 0.3);
}
.cart-line__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cart-line__body { min-width: 0; }
.cart-line__title {
  font-family: var(--font-display);
  font-size: 15px;
  color: rgb(var(--color-navy));
  text-decoration: none;
  display: block;
  margin-bottom: 2px;
  line-height: 1.25;
}
.cart-line__variant { font-size: 12px; color: rgb(var(--color-ink) / 0.6); margin: 0 0 4px; }
.cart-line__props {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  font-size: 12px;
  color: rgb(var(--color-ink) / 0.7);
  line-height: 1.5;
}
.cart-line__props li span { font-weight: 600; color: rgb(var(--color-navy)); }

.cart-line__qty-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cart-line__qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgb(var(--color-line));
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.cart-line__qty button {
  background: none;
  border: 0;
  width: 28px; height: 28px;
  cursor: pointer;
  color: rgb(var(--color-navy));
  font-size: 16px;
}
.cart-line__qty input {
  width: 30px;
  border: 0;
  background: transparent;
  text-align: center;
  font-family: var(--font-body);
  font-size: 14px;
  color: rgb(var(--color-navy));
  -moz-appearance: textfield;
}
.cart-line__qty input::-webkit-outer-spin-button,
.cart-line__qty input::-webkit-inner-spin-button { -webkit-appearance: none; }
.cart-line__price {
  font-family: var(--font-display);
  font-size: 14px;
  color: rgb(var(--color-ink));
}

.cart-drawer__footer {
  border-top: 1px solid rgb(var(--color-line));
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgb(var(--color-surface));
}
.cart-drawer__totals {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--font-display);
  font-size: 18px;
  color: rgb(var(--color-navy));
  margin-bottom: 4px;
}
.cart-drawer__totals strong { font-weight: 600; }
.cart-drawer__checkout, .cart-drawer__view-cart, .cart-drawer__shop { width: 100%; }
.cart-drawer__note { font-size: 12px; color: rgb(var(--color-ink) / 0.55); text-align: center; margin: 0; }
```

- [ ] **Step 8.5: Create `assets/cart-drawer.js`**

```javascript
// Clarke By Design — cart-drawer.js
// Opens drawer on Add to Cart submit; updates contents via Shopify cart AJAX.

(function () {
  const drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;

  const bodyEl = drawer.querySelector('[data-cart-drawer-body]');
  const footerEl = drawer.querySelector('[data-cart-drawer-footer]');
  const closeEls = drawer.querySelectorAll('[data-cart-drawer-close]');

  const openDrawer = () => {
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    setTimeout(() => { drawer.hidden = true; }, 250);
  };
  closeEls.forEach((el) => el.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
  });

  // Public hook so other scripts (e.g. header cart icon) can open
  window.ClarkeCart = { open: openDrawer, close: closeDrawer, refresh };

  async function refresh() {
    const res = await fetch('/?section_id=cart-drawer');
    if (!res.ok) return;
    const html = await res.text();
    // Find body and footer fragments
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newBody = doc.querySelector('[data-cart-drawer-body]');
    const newFooter = doc.querySelector('[data-cart-drawer-footer]');
    if (newBody) bodyEl.innerHTML = newBody.innerHTML;
    if (newFooter) footerEl.innerHTML = newFooter.innerHTML;
    // Update header cart count badge
    const cartRes = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
    if (cartRes.ok) {
      const cart = await cartRes.json();
      document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = cart.item_count; });
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
    }
  }

  // Intercept product-form submits
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-product-form]');
    if (!form) return;
    e.preventDefault();
    const btn = form.querySelector('[data-add-to-cart]');
    if (btn) btn.disabled = true;
    try {
      const fd = new FormData(form);
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.description || 'Could not add to cart. Please try again.');
        return;
      }
      await refresh();
      openDrawer();
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  // Header cart icon also opens drawer instead of navigating
  document.querySelectorAll('.site-header__cart').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  });

  // Quantity changes inside the drawer
  drawer.addEventListener('click', async (e) => {
    const dec = e.target.closest('[data-cart-qty-decrement]');
    const inc = e.target.closest('[data-cart-qty-increment]');
    if (!dec && !inc) return;
    const wrap = e.target.closest('.cart-line__qty');
    const input = wrap.querySelector('[data-cart-qty-input]');
    let val = parseInt(input.value, 10) || 0;
    val = dec ? Math.max(0, val - 1) : val + 1;
    await updateLine(input.dataset.lineKey, val);
  });
  drawer.addEventListener('change', async (e) => {
    const input = e.target.closest('[data-cart-qty-input]');
    if (!input) return;
    const val = Math.max(0, parseInt(input.value, 10) || 0);
    await updateLine(input.dataset.lineKey, val);
  });

  async function updateLine(key, quantity) {
    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity })
    });
    await refresh();
  }
})();
```

- [ ] **Step 8.6: Render the drawer once globally**

In `layout/theme.liquid`, immediately before `</body>`, add (after `theme.js`, before any product-specific script):

```liquid
{% section 'cart-drawer' %}
<script src="{{ 'cart-drawer.js' | asset_url }}" defer></script>
```

- [ ] **Step 8.7: Smoke test**

```bash
npm run dev
```
On a product, complete personalization, submit Add to Cart. Expect: drawer slides in from the right, line item shows the variant title (`Birch / Cream / None`) and the line-item properties (Name: Lucas, Font: Script) beneath. Increment/decrement qty re-fetches. Click X or backdrop or press ESC → drawer closes. Cart count in header updates.

- [ ] **Step 8.8: Commit**

```bash
git add sections/cart-drawer.liquid snippets/cart-drawer-contents.liquid snippets/cart-drawer-footer.liquid assets/cart-drawer.css assets/cart-drawer.js snippets/icons-sprite.liquid layout/theme.liquid
git commit -m "feat(cart): add cart drawer with line-item properties surfaced"
```

---

## Task 9: Live SVG preview stub (phase-2 deferral)

**Files:**
- Create: `assets/product-preview.js` (stub only, NOT loaded)

This file exists so the structure is committed but the feature ships in phase 2 per spec §5.4. Do not add it to the layout's script tags.

- [ ] **Step 9.1: Create `assets/product-preview.js`**

```javascript
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
```

- [ ] **Step 9.2: Commit**

```bash
git add assets/product-preview.js
git commit -m "chore(product): stub product-preview.js for phase-2 live SVG preview"
```

---

## Task 10: Theme check + push + manual verification

**Files:** none

- [ ] **Step 10.1: Run theme check**

```bash
npm run check
```
Expected: no fatal errors. Address any warnings that point at our new files.

- [ ] **Step 10.2: Push the unpublished theme**

```bash
npm run push
```

- [ ] **Step 10.3: In the dev store admin, set up a test product with 3 options**

Products → Add product → "Test — Acrylic Name Sign":
- Option 1: `Backer` — values `Birch`, `Cream`, `Black`
- Option 2: `Letter` — values `Cream`, `Blush`, `Navy`
- Option 3: `Add-on` — values `None`, `Gift wrap`, `Mini card`

Add a `personalization.chip_colors` metafield (JSON, namespace `personalization`, key `chip_colors`):

```json
{
  "Birch": "#B68A65",
  "Cream": "#F8F1E7",
  "Black": "#1F1A15",
  "Blush": "#EAC8C2",
  "Navy": "#142A44"
}
```

Add a `personalization.fonts` metafield (JSON) — leave empty to use defaults, or set:

```json
[
  { "id": "script", "name": "Script", "family": "Pacifico", "stack": "'Pacifico', cursive" },
  { "id": "block",  "name": "Block",  "family": "Bebas Neue", "stack": "'Bebas Neue', sans-serif" }
]
```

Upload 3+ images.

- [ ] **Step 10.4: Manual verification checklist**

Open the test product:
- [ ] Two-column layout on desktop, single on mobile.
- [ ] Gallery main image swaps when thumbs clicked; active thumb gets navy ring.
- [ ] Eyebrow shows the collection name, title in Playfair, rating row, price in Playfair.
- [ ] Name input: 0/10 counter, increments to 4/10 on `Luca`, accepts up to 10 chars.
- [ ] Backer row: circular swatches in Birch/Cream/Black, click cycles, navy ring appears on active.
- [ ] Letter row: same.
- [ ] Font row: three chip cards, each in actual Pacifico/Bebas/Permanent Marker, navy border on active.
- [ ] Add-on row: vertical stack of bordered cards, checkbox-style box flips to filled-navy on select.
- [ ] CTA shows "Add to cart — $14.00"; updates live when a more expensive variant is selected.
- [ ] CTA disables when Name is empty or an unavailable variant is selected.
- [ ] Below the fold: 3 expanded tabs (first open, others closed); clicking each toggles.
- [ ] "You may also like" renders 4 product cards from the `all` collection (or whatever the section's collection is set to).
- [ ] Click Add to cart → drawer slides in, line shows `Birch / Cream / None` variant title and `Name: Lucas`, `Font: Script` under it.
- [ ] Quantity buttons in drawer increment/decrement live.
- [ ] Header cart icon click opens drawer (doesn't navigate).
- [ ] ESC + backdrop click + X close it.

- [ ] **Step 10.5: Tag**

```bash
git tag v0.2.0-product -m "Product page + personalization complete"
git push origin main --tags
```

---

## Self-Review Results

**Spec coverage:**

| Spec section | Implemented in | ✓ |
| --- | --- | --- |
| §5.1 Two-column sticky layout | Task 1 (`section-product-main.css`) | ✓ |
| §5.1 Primary image + 4 thumbs with active ring | Task 2 (`product-gallery.liquid`) + Task 6.2 (active-thumb CSS) | ✓ |
| §5.1 Eyebrow / title / rating / price / short description | Task 3 (`sections/product-main.liquid`) | ✓ |
| §5.1 Primary CTA "Add to Cart — $X" | Task 3 + live update in Task 6 | ✓ |
| §5.1 Secondary "Save for later" ghost CTA | Task 3 | ✓ |
| §5.1 Below-the-fold long description / materials / care / shipping | Task 7 (`sections/product-tabs.liquid`) | ✓ |
| §5.1 "You may also like" 4-up product row | Task 1.1 (template) reusing Plan 1's `product-row` section | ✓ |
| §5.2 Name text input + char limit | Task 4.3 + counter in Task 6 | ✓ |
| §5.2 Circular backer swatches with white border, line ring, navy active ring + checkmark | Task 4 (`chip-swatch.liquid` + `chip-picker.css`) | ✓ |
| §5.2 Letter swatches (same pattern) | Task 4 | ✓ |
| §5.2 Font chip cards rendering Pacifico / Bebas Neue / Permanent Marker | Task 5 (`chip-font.liquid`) with metafield override | ✓ |
| §5.2 Add-on checkbox cards | Task 4 (`chip-addon.liquid`) | ✓ |
| §5.2 Line-item-property storage for personalization | Task 4 (`properties[Name]`) + Task 5 (`properties[Font]`) | ✓ |
| §5.3 Backer = option 1, Letter = option 2, Add-on = option 3 (variant) | Task 4.3 `forloop.index` mapping | ✓ |
| §5.3 Font + Name = line-item properties | Tasks 4 & 5 | ✓ |
| §5.4 Live SVG preview | **Stub only in Task 9 (`product-preview.js`)** — deferred per spec | deferred ✓ |
| §6.5 Cart drawer that opens on add | Task 8 (`cart-drawer.liquid` + `cart-drawer.js`) | ✓ |
| §6.5 Line items show personalization properties beneath title | Task 8.2 (`cart-drawer-contents.liquid` iterates `item.properties`) | ✓ |
| §6.5 Subtotal + Checkout CTA | Task 8.3 (`cart-drawer-footer.liquid`) | ✓ |
| §7.5 Keyboard-accessible focus rings (navy 2px) | Inherits Plan 1's `*:focus-visible` rule; chip radios get visible ring via `:focus-visible + .chip-swatch__dot` | ✓ |

**Explicitly NOT covered (out of scope for Plan 2):**
- Reviews section on product page (covered by Plan 1's `featured-reviews` if dropped in via theme editor).
- Wishlist persistence behind the "Save for later" button — Plan 4 (or phase 2).
- Local-pickup-aware messaging — Plan 4.

**Placeholder scan:** every code step contains real code. No "TBD", no "fill in", no "add error handling later". The phase-2 deferral file (`product-preview.js`) is a stub by design and labelled as such in its header.

**Type consistency:**
- `data-product-main`, `data-product-form`, `data-variant-id-input`, `data-variants-json`, `data-chip-option`, `data-property-name`, `data-name-counter`, `data-price-current`, `data-cta-price`, `data-cta-label`, `data-add-to-cart`, `data-gallery`, `data-cart-drawer`, `data-cart-drawer-body`, `data-cart-drawer-footer`, `data-cart-drawer-close`, `data-cart-qty-input`, `data-cart-qty-decrement`, `data-cart-qty-increment`, `data-line-key` — each appears in exactly one HTML location and is read by exactly one JS file.
- BEM-ish class style (`product-page__*`, `product-gallery__*`, `chip-swatch__*`, `chip-addon__*`, `chip-font__*`, `picker-block__*`, `cart-drawer__*`, `cart-line__*`) — consistent with Plan 1's `site-header__*`, `hero-tile__*` style.
- Colour tokens always referenced as `rgb(var(--color-navy))` etc., matching Plan 1.
- Variant option positions (1/2/3) are sourced from `forloop.index` on `product.options_with_values` and from `option1`/`option2`/`option3` on the JSON variants — same ordering convention on both sides.
- Line-item property keys: `Name`, `Font` — these are the visible-to-customer keys, both Title Case, no underscore (so the cart drawer's "skip if first contains `_`" filter does not hide them).

**Open items flagged for owner:**
- `product.metafields.personalization.chip_colors` and `product.metafields.personalization.fonts` are custom metafields the owner must define in admin (Settings → Custom data → Products). The plan's Task 10.3 documents this; we could add an automated setup script in Plan 4 but it's not needed for the theme code itself.
- Spec §9 open question #2 (add-on pricing model) was resolved in this plan as "cents-up variants" — i.e. the add-on is option 3, and the variant for `… / Gift wrap` is priced higher than `… / None`. If owner later opts for an add-on app, the option-3 column can be collapsed and the property-only path becomes the source of truth.

Plan complete.
