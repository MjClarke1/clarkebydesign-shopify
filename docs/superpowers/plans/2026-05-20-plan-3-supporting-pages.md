# Plan 3 — Supporting Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build out the four supporting page templates from spec §6.1–§6.4 — Collection (filterable product grid with sort + facets), Markets (full upcoming + past-markets list with `.ics` calendar export), Custom Orders (3-step process + native Shopify contact form with photo uploads), and About (portrait hero + story + stats + process gallery) — so the storefront is feature-complete on every non-product, non-cart page.

**Architecture:** Reuse Plan 1's brand tokens (`assets/base.css`), section conventions, BEM class style, and the `product-card.liquid` snippet. New page templates are JSON-driven (`templates/collection.json`, `templates/page.markets.json`, etc.) wired to either a single dedicated `main-*` section or a stack of reusable sections. The Markets page reuses Plan 1's `markets-list` section schema philosophy but in a richer "full-list" variant. Custom Orders posts via Shopify's native `{% form 'contact' %}` (delivery to `clarkebydesign@gmail.com` is set in the admin Notifications panel — no app required).

**Tech Stack:**
- Liquid templating (Online Store 2.0 sections + JSON templates)
- Vanilla JS (ES modules) — one small `.ics` generator + filter drawer + past-markets toggle
- CSS custom properties (Plan 1 tokens — no preprocessor)
- Shopify native contact form (no third-party form app)
- Shopify Storefront Filtering (`collection.filters` API)

---

## File Structure

```
.
├── assets/
│   ├── section-main-collection.css     # Filter sidebar + product grid layout
│   ├── section-markets-page.css        # Full markets page styling
│   ├── section-custom-orders.css       # Hero + steps + form styling
│   ├── section-about.css               # Portrait hero, stats, gallery
│   ├── collection-filters.js           # Sidebar drawer toggle + apply-on-change
│   ├── markets-page.js                 # .ics generator + past-markets toggle
│   └── custom-orders.js                # Photo-upload UX (preview + max-5 enforce)
├── sections/
│   ├── main-collection.liquid          # Filterable, sortable product grid
│   ├── markets-page.liquid             # Full upcoming + past list, ics links
│   ├── custom-orders-hero.liquid       # Hero heading + intro paragraph
│   ├── custom-orders-steps.liquid      # 3-step process explainer (blocks)
│   ├── custom-orders-form.liquid       # Native contact form
│   ├── custom-orders-gallery.liquid    # Past custom pieces (image blocks)
│   ├── about-hero.liquid               # Portrait + Playfair "Hi, I'm Marielle"
│   ├── about-story.liquid              # Long-form rich-text story
│   ├── about-stats.liquid              # Stats row (blocks)
│   ├── about-process.liquid            # 3–4 process image blocks
│   └── about-cta.liquid                # Footer CTA (navy block)
├── snippets/
│   └── facet-checkbox.liquid           # Single filter checkbox renderer
├── templates/
│   ├── collection.json                 # Collection template
│   ├── page.markets.json               # Markets page template
│   ├── page.custom-orders.json         # Custom Orders page template
│   └── page.about.json                 # About page template
└── locales/
    └── en.default.json                 # +strings for filters/sort/form/markets
```

---

## Pre-flight: admin setup before code

These admin steps are one-time and unblock the templates.

- [ ] **Step P1: Create the three CMS pages in Shopify admin**

Shopify admin → Online Store → Pages → Add page. Create all three:
- Title: `Markets` → URL handle: `markets` → Template suffix: `markets`
- Title: `Custom Orders` → URL handle: `custom-orders` → Template suffix: `custom-orders`
- Title: `About` → URL handle: `about` → Template suffix: `about`

Leave Content blank — sections will provide the visible content.

- [ ] **Step P2: Verify contact form delivery email**

Shopify admin → Settings → Notifications → "Sender email" — confirm it is `clarkebydesign@gmail.com` (or that the email forwarder routes to it). Native `{% form 'contact' %}` submissions go here automatically; no app needed.

- [ ] **Step P3: Add Storefront Filtering (`collection.filters`) to the default product filtering**

Shopify admin → Settings → Search & discovery → Filters tab. Add filters on the **Default** group:
- Price range
- Product type → "Occasion" (we'll source occasion from product tags or product type; spec calls for tag-based)
- Tag: `color:*` group (enable tag-based filtering — Shopify shows tags as facets automatically once enabled)

If your products don't yet use `occasion:*` and `color:*` tags, just add the filter definitions — empty facets won't break the page.

---

## Task 1: Collection template skeleton + main-collection section

**Files:**
- Create: `templates/collection.json`
- Create: `sections/main-collection.liquid`

- [ ] **Step 1.1: Create `templates/collection.json`**

```json
{
  "sections": {
    "main": {
      "type": "main-collection",
      "settings": {
        "products_per_page": 24,
        "show_filters": true,
        "show_sort": true
      }
    }
  },
  "order": ["main"]
}
```

- [ ] **Step 1.2: Create the section shell at `sections/main-collection.liquid`**

```liquid
{{ 'section-main-collection.css' | asset_url | stylesheet_tag }}
<script src="{{ 'collection-filters.js' | asset_url }}" defer></script>

{%- paginate collection.products by section.settings.products_per_page -%}
<section class="collection-page section">
  <div class="container">
    <header class="collection-page__hero">
      <p class="eyebrow">{{ 'collections.general.collection' | t }}</p>
      <h1 class="collection-page__title">{{ collection.title }}</h1>
      {%- if collection.description != blank -%}
        <div class="collection-page__desc">{{ collection.description }}</div>
      {%- endif -%}
    </header>

    <div class="collection-page__layout">
      {%- if section.settings.show_filters -%}
        {%- render 'collection-filters-aside', collection: collection -%}
      {%- endif -%}

      <div class="collection-page__main">
        {%- render 'collection-sort-bar', collection: collection, paginate: paginate, section: section -%}
        {%- render 'collection-grid', collection: collection -%}
        {%- render 'collection-pagination', paginate: paginate -%}
      </div>
    </div>
  </div>
</section>
{%- endpaginate -%}

{% schema %}
{
  "name": "Main Collection",
  "settings": [
    { "type": "range",    "id": "products_per_page", "label": "Products per page", "min": 8, "max": 48, "step": 4, "default": 24 },
    { "type": "checkbox", "id": "show_filters",      "label": "Show filter sidebar", "default": true },
    { "type": "checkbox", "id": "show_sort",         "label": "Show sort dropdown",  "default": true }
  ]
}
{% endschema %}
```

- [ ] **Step 1.3: Smoke-test that the template loads**

```bash
npm run dev
```
Navigate to `/collections/all`. Expect: the title and description render but inner snippets are missing (errors expected). Stop dev server.

- [ ] **Step 1.4: Commit**

```bash
git add templates/collection.json sections/main-collection.liquid
git commit -m "feat(collection): scaffold collection template + main section shell"
```

---

## Task 2: Collection filter sidebar + facet snippet

**Files:**
- Create: `snippets/collection-filters-aside.liquid`
- Create: `snippets/facet-checkbox.liquid`

- [ ] **Step 2.1: Create `snippets/facet-checkbox.liquid`**

```liquid
{%- comment -%} Renders one filter value as a labeled checkbox. {%- endcomment -%}
<label class="facet-checkbox" {% if value.count == 0 and value.active == false %}data-empty="true"{% endif %}>
  <input
    type="checkbox"
    name="{{ value.param_name }}"
    value="{{ value.value }}"
    {% if value.active %}checked{% endif %}
    {% if value.count == 0 and value.active == false %}disabled{% endif %}
    data-facet-input
  >
  <span class="facet-checkbox__label">{{ value.label | escape }}</span>
  <span class="facet-checkbox__count">{{ value.count }}</span>
</label>
```

- [ ] **Step 2.2: Create `snippets/collection-filters-aside.liquid`**

This renders one `<details>` block per facet (Occasion, Color, Price range). It uses Shopify's `collection.filters` API so it works with any filter the merchant enables in admin.

```liquid
<aside class="collection-filters" aria-label="Filters">
  <div class="collection-filters__head">
    <h2 class="collection-filters__title">{{ 'collections.filters.title' | t }}</h2>
    <button type="button" class="collection-filters__close" data-filters-close aria-label="{{ 'collections.filters.close' | t }}">×</button>
  </div>

  <form id="CollectionFiltersForm" method="get" class="collection-filters__form">
    {%- for filter in collection.filters -%}
      <details class="filter-group" open>
        <summary class="filter-group__summary">
          <span>{{ filter.label }}</span>
          {%- render 'icon', name: 'chevron-down', size: 12 -%}
        </summary>
        <div class="filter-group__body">
          {%- case filter.type -%}
            {%- when 'list' -%}
              {%- for value in filter.values -%}
                {%- render 'facet-checkbox', value: value -%}
              {%- endfor -%}
            {%- when 'price_range' -%}
              <div class="filter-group__price">
                <label>
                  <span>{{ 'collections.filters.from' | t }}</span>
                  <input type="number" name="{{ filter.min_value.param_name }}"
                         value="{{ filter.min_value.value }}"
                         placeholder="{{ filter.range_min | money_without_currency }}"
                         min="0" step="1">
                </label>
                <label>
                  <span>{{ 'collections.filters.to' | t }}</span>
                  <input type="number" name="{{ filter.max_value.param_name }}"
                         value="{{ filter.max_value.value }}"
                         placeholder="{{ filter.range_max | money_without_currency }}"
                         min="0" step="1">
                </label>
              </div>
          {%- endcase -%}
        </div>
      </details>
    {%- endfor -%}

    {%- comment -%} Preserve sort when filters change {%- endcomment -%}
    {%- if collection.sort_by != blank -%}
      <input type="hidden" name="sort_by" value="{{ collection.sort_by }}">
    {%- endif -%}

    <div class="collection-filters__actions">
      <button type="submit" class="btn btn-primary collection-filters__apply">{{ 'collections.filters.apply' | t }}</button>
      <a href="{{ collection.url }}" class="collection-filters__clear">{{ 'collections.filters.clear' | t }}</a>
    </div>
  </form>
</aside>
```

- [ ] **Step 2.3: Add filter strings to `locales/en.default.json`**

In the existing `collections` group (or add it), insert:

```json
"filters": {
  "title": "Filter",
  "close": "Close filters",
  "open": "Filter & Sort",
  "from": "From",
  "to": "To",
  "apply": "Apply",
  "clear": "Clear all"
}
```

- [ ] **Step 2.4: Commit**

```bash
git add snippets/collection-filters-aside.liquid snippets/facet-checkbox.liquid locales/en.default.json
git commit -m "feat(collection): add filter sidebar with facet checkboxes and price range"
```

---

## Task 3: Collection sort bar + product grid + pagination

**Files:**
- Create: `snippets/collection-sort-bar.liquid`
- Create: `snippets/collection-grid.liquid`
- Create: `snippets/collection-pagination.liquid`

- [ ] **Step 3.1: Create `snippets/collection-sort-bar.liquid`**

```liquid
<div class="collection-sort">
  <button type="button" class="collection-sort__filters-btn" data-filters-open>
    {%- render 'icon', name: 'menu', size: 16 -%}
    <span>{{ 'collections.filters.open' | t }}</span>
  </button>

  <p class="collection-sort__count">
    {{ paginate.items }} {{ 'collections.general.items' | t }}
  </p>

  {%- if section.settings.show_sort -%}
    <form class="collection-sort__form" method="get">
      <label for="SortBy" class="collection-sort__label">{{ 'collections.sort.title' | t }}</label>
      <select id="SortBy" name="sort_by" data-sort-select>
        {%- assign current = collection.sort_by | default: collection.default_sort_by -%}
        <option value="created-descending" {% if current == 'created-descending' %}selected{% endif %}>{{ 'collections.sort.newest' | t }}</option>
        <option value="best-selling"       {% if current == 'best-selling'       %}selected{% endif %}>{{ 'collections.sort.best_selling' | t }}</option>
        <option value="price-ascending"    {% if current == 'price-ascending'    %}selected{% endif %}>{{ 'collections.sort.price_asc' | t }}</option>
        <option value="price-descending"   {% if current == 'price-descending'   %}selected{% endif %}>{{ 'collections.sort.price_desc' | t }}</option>
      </select>
    </form>
  {%- endif -%}
</div>
```

- [ ] **Step 3.2: Create `snippets/collection-grid.liquid`**

Reuses Plan 1's `product-card.liquid` snippet.

```liquid
<div class="collection-grid">
  {%- for product in collection.products -%}
    {% render 'product-card', product: product %}
  {%- else -%}
    <p class="collection-grid__empty">
      {{ 'collections.general.no_matches' | t }}
      <a href="{{ collection.url }}">{{ 'collections.filters.clear' | t }}</a>
    </p>
  {%- endfor -%}
</div>
```

- [ ] **Step 3.3: Create `snippets/collection-pagination.liquid`**

```liquid
{%- if paginate.pages > 1 -%}
  <nav class="collection-pagination" aria-label="Pagination">
    {%- if paginate.previous -%}
      <a class="collection-pagination__prev" href="{{ paginate.previous.url }}">← {{ 'general.pagination.previous' | t }}</a>
    {%- endif -%}

    <ul class="collection-pagination__pages">
      {%- for part in paginate.parts -%}
        <li>
          {%- if part.is_link -%}
            <a href="{{ part.url }}">{{ part.title }}</a>
          {%- else -%}
            <span aria-current="page">{{ part.title }}</span>
          {%- endif -%}
        </li>
      {%- endfor -%}
    </ul>

    {%- if paginate.next -%}
      <a class="collection-pagination__next" href="{{ paginate.next.url }}">{{ 'general.pagination.next' | t }} →</a>
    {%- endif -%}
  </nav>
{%- endif -%}
```

- [ ] **Step 3.4: Add sort + general strings to `locales/en.default.json`**

In `collections.general` add `"items": "items"` and `"no_matches": "No products match those filters."` if not present. In `collections.sort` group:

```json
"sort": {
  "title": "Sort by",
  "newest": "Newest",
  "best_selling": "Best selling",
  "price_asc": "Price: low to high",
  "price_desc": "Price: high to low"
}
```

- [ ] **Step 3.5: Commit**

```bash
git add snippets/collection-sort-bar.liquid snippets/collection-grid.liquid snippets/collection-pagination.liquid locales/en.default.json
git commit -m "feat(collection): add sort bar, product grid, and pagination snippets"
```

---

## Task 4: Collection styles + sidebar JS (sticky desktop, drawer mobile)

**Files:**
- Create: `assets/section-main-collection.css`
- Create: `assets/collection-filters.js`

- [ ] **Step 4.1: Create `assets/section-main-collection.css`**

```css
.collection-page__hero { text-align: center; padding-bottom: 32px; border-bottom: 1px solid rgb(var(--color-line)); margin-bottom: 32px; }
.collection-page__title { font-size: var(--fs-h1); margin: 4px 0 12px; }
.collection-page__desc { color: rgb(var(--color-ink) / 0.7); max-width: 60ch; margin: 0 auto; }

.collection-page__layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  align-items: start;
}

/* --- Sidebar --- */
.collection-filters {
  position: sticky;
  top: 96px;
  background: rgb(var(--color-surface));
  border: 1px solid rgb(var(--color-line));
  border-radius: var(--radius-md);
  padding: 20px;
}
.collection-filters__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.collection-filters__title { font-size: 16px; margin: 0; }
.collection-filters__close { background: none; border: 0; font-size: 28px; cursor: pointer; color: rgb(var(--color-navy)); display: none; line-height: 1; }

.filter-group { border-bottom: 1px solid rgb(var(--color-line)); padding: 12px 0; }
.filter-group:last-of-type { border-bottom: 0; }
.filter-group__summary {
  display: flex; align-items: center; justify-content: space-between;
  font-family: var(--font-body);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  color: rgb(var(--color-navy));
  cursor: pointer;
  list-style: none;
}
.filter-group__summary::-webkit-details-marker { display: none; }
.filter-group[open] .filter-group__summary .icon-chevron-down { transform: rotate(180deg); }
.filter-group__body { padding-top: 10px; display: flex; flex-direction: column; gap: 6px; }

.facet-checkbox {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
}
.facet-checkbox input { accent-color: rgb(var(--color-navy)); }
.facet-checkbox__count { font-size: 11px; opacity: 0.55; }
.facet-checkbox[data-empty="true"] { opacity: 0.4; cursor: not-allowed; }

.filter-group__price { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.filter-group__price label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.1em; }
.filter-group__price input {
  padding: 8px 10px;
  border: 1.5px solid rgb(var(--color-line));
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 14px;
}

.collection-filters__actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.collection-filters__apply { width: 100%; }
.collection-filters__clear {
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  opacity: 0.7;
  text-decoration: underline;
}

/* --- Sort bar --- */
.collection-sort {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgb(var(--color-line));
}
.collection-sort__filters-btn {
  display: none;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1.5px solid rgb(var(--color-navy));
  color: rgb(var(--color-navy));
  border-radius: var(--radius-pill);
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}
.collection-sort__count { margin: 0; opacity: 0.65; font-size: 13px; flex: 1; }
.collection-sort__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.7; margin-right: 8px; }
.collection-sort__form select {
  padding: 8px 32px 8px 12px;
  border: 1.5px solid rgb(var(--color-line));
  border-radius: var(--radius-pill);
  background: rgb(var(--color-surface));
  font-family: var(--font-body);
  font-size: 13px;
  color: rgb(var(--color-navy));
  cursor: pointer;
}

/* --- Grid (3-up desktop, 2-up tablet, 1-up mobile) --- */
.collection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px 18px;
}
.collection-grid__empty { grid-column: 1 / -1; text-align: center; padding: 40px 0; opacity: 0.7; }

/* --- Pagination --- */
.collection-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 40px; }
.collection-pagination__pages { display: flex; gap: 6px; list-style: none; padding: 0; margin: 0; }
.collection-pagination__pages a,
.collection-pagination__pages span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  text-decoration: none;
  color: rgb(var(--color-navy));
}
.collection-pagination__pages span[aria-current] { background: rgb(var(--color-navy)); color: rgb(var(--color-bg)); }
.collection-pagination__prev,
.collection-pagination__next {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  text-decoration: none;
}

/* --- Tablet (2-up) --- */
@media (max-width: 1024px) {
  .collection-page__layout { grid-template-columns: 220px 1fr; gap: 28px; }
  .collection-grid { grid-template-columns: 1fr 1fr; }
}

/* --- Mobile (drawer + 1-up) --- */
@media (max-width: 720px) {
  .collection-page__layout { grid-template-columns: 1fr; }
  .collection-sort__filters-btn { display: inline-flex; }
  .collection-filters {
    position: fixed;
    inset: 0;
    border-radius: 0;
    border: 0;
    z-index: 200;
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .collection-filters--open { transform: translateX(0); }
  .collection-filters__close { display: inline-block; }
  .collection-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 4.2: Create `assets/collection-filters.js`**

```javascript
// Collection filters: drawer toggle + auto-submit on sort change.
(function () {
  const sidebar = document.querySelector('.collection-filters');
  const openBtn = document.querySelector('[data-filters-open]');
  const closeBtn = document.querySelector('[data-filters-close]');
  const sortSelect = document.querySelector('[data-sort-select]');

  if (openBtn && sidebar) {
    openBtn.addEventListener('click', () => sidebar.classList.add('collection-filters--open'));
  }
  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => sidebar.classList.remove('collection-filters--open'));
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      // Build a URL preserving existing filter params, replacing sort_by.
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', sortSelect.value);
      url.searchParams.delete('page');
      window.location.assign(url.toString());
    });
  }
})();
```

- [ ] **Step 4.3: Test in dev**

```bash
npm run dev
```
Verify: at `/collections/all` the sidebar shows on the left, grid is 3-up desktop. Resize to mobile — sidebar is hidden, "Filter & Sort" button appears, clicking it slides the sidebar in. Sort dropdown reloads the page with `?sort_by=` set.

- [ ] **Step 4.4: Commit**

```bash
git add assets/section-main-collection.css assets/collection-filters.js
git commit -m "feat(collection): style sidebar + grid, add drawer JS and sort auto-submit"
```

---

## Task 5: Markets page template + section shell

**Files:**
- Create: `templates/page.markets.json`
- Create: `sections/markets-page.liquid`

- [ ] **Step 5.1: Create `templates/page.markets.json`**

```json
{
  "sections": {
    "markets_hero": {
      "type": "image-with-text",
      "settings": {
        "eyebrow": "find us in person",
        "heading": "Markets & makers' fairs",
        "body": "Clarke By Design pops up across Ontario through the year. Here's where to find me next — and where I've been."
      }
    },
    "markets_full": {
      "type": "markets-page",
      "settings": {}
    }
  },
  "order": ["markets_hero", "markets_full"]
}
```

(`image-with-text` is provided by Dawn / Plan 1's section inventory §7.2; if it isn't yet present in the theme, the markets page falls back to its own internal hero block — see Step 5.2.)

- [ ] **Step 5.2: Create `sections/markets-page.liquid`**

```liquid
{{ 'section-markets-page.css' | asset_url | stylesheet_tag }}
<script src="{{ 'markets-page.js' | asset_url }}" defer></script>

{%- assign all_markets = shop.metaobjects.market_event.values | sort: 'start_date' -%}
{%- assign today = 'now' | date: '%Y-%m-%d' -%}

<section class="markets-page section">
  <div class="container">
    {%- if section.settings.heading != blank -%}
      <p class="eyebrow">{{ section.settings.eyebrow }}</p>
      <h1 class="markets-page__title">{{ section.settings.heading }}</h1>
      {%- if section.settings.lede != blank -%}
        <p class="markets-page__lede">{{ section.settings.lede }}</p>
      {%- endif -%}
    {%- endif -%}

    <h2 class="markets-page__section-title">{{ 'markets.upcoming' | t }}</h2>
    <ul class="markets-page__list" data-markets-list>
      {%- assign upcoming_count = 0 -%}
      {%- for m in all_markets -%}
        {%- assign iso = m.start_date | date: '%Y-%m-%d' -%}
        {%- if iso >= today -%}
          {%- render 'market-row-full', m: m, past: false -%}
          {%- assign upcoming_count = upcoming_count | plus: 1 -%}
        {%- endif -%}
      {%- endfor -%}
      {%- if upcoming_count == 0 -%}
        <li class="market-row-full market-row-full--empty">{{ 'markets.none_upcoming' | t }}</li>
      {%- endif -%}
    </ul>

    <details class="markets-page__past" data-past-toggle>
      <summary class="markets-page__past-summary">
        <span>{{ 'markets.past' | t }}</span>
        {%- render 'icon', name: 'chevron-down', size: 14 -%}
      </summary>
      <ul class="markets-page__list markets-page__list--past">
        {%- assign past_count = 0 -%}
        {%- for m in all_markets reversed -%}
          {%- assign iso = m.start_date | date: '%Y-%m-%d' -%}
          {%- if iso < today -%}
            {%- render 'market-row-full', m: m, past: true -%}
            {%- assign past_count = past_count | plus: 1 -%}
          {%- endif -%}
        {%- endfor -%}
        {%- if past_count == 0 -%}
          <li class="market-row-full market-row-full--empty">{{ 'markets.none_past' | t }}</li>
        {%- endif -%}
      </ul>
    </details>
  </div>
</section>

{% schema %}
{
  "name": "Markets page",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow",  "default": "find us in person" },
    { "type": "text", "id": "heading", "label": "Heading",  "default": "Markets & makers' fairs" },
    { "type": "text", "id": "lede",    "label": "Lede",     "default": "Clarke By Design pops up across Ontario through the year." }
  ],
  "presets": [ { "name": "Markets page" } ]
}
{% endschema %}
```

- [ ] **Step 5.3: Add markets strings to `locales/en.default.json`**

```json
"markets": {
  "upcoming": "Upcoming markets",
  "past": "Past markets",
  "none_upcoming": "No upcoming markets at the moment — check back soon.",
  "none_past": "No past markets to show.",
  "view_map": "View on Google Maps",
  "add_to_calendar": "Add to calendar"
}
```

- [ ] **Step 5.4: Commit**

```bash
git add templates/page.markets.json sections/markets-page.liquid locales/en.default.json
git commit -m "feat(markets-page): scaffold full markets page template + section"
```

---

## Task 6: Market row snippet (full version) + page styles

**Files:**
- Create: `snippets/market-row-full.liquid`
- Create: `assets/section-markets-page.css`

- [ ] **Step 6.1: Create `snippets/market-row-full.liquid`**

Stores the event payload in a `data-*` attribute so the .ics generator (Task 7) can read it without re-querying Liquid.

```liquid
{%- comment -%}
  Params: m (market_event metaobject), past (boolean).
  Adds an Add-to-calendar button + map link for upcoming events.
{%- endcomment -%}
<li class="market-row-full{% if past %} market-row-full--past{% endif %}"
    data-market
    data-name="{{ m.name | escape }}"
    data-start-date="{{ m.start_date | date: '%Y-%m-%d' }}"
    data-end-date="{{ m.end_date | date: '%Y-%m-%d' | default: m.start_date | date: '%Y-%m-%d' }}"
    data-start-time="{{ m.start_time | escape }}"
    data-end-time="{{ m.end_time | escape }}"
    data-venue="{{ m.venue_name | escape }}"
    data-address="{{ m.address | escape }}">

  <div class="market-row-full__date">
    <span class="market-row-full__month">{{ m.start_date | date: '%b' }}</span>
    <span class="market-row-full__day">{{ m.start_date | date: '%-d' }}</span>
    <span class="market-row-full__year">{{ m.start_date | date: '%Y' }}</span>
  </div>

  <div class="market-row-full__body">
    <h3 class="market-row-full__name">{{ m.name }}</h3>
    <p class="market-row-full__when">{{ m.start_time }} – {{ m.end_time }}</p>
    {%- if m.venue_name != blank -%}
      <p class="market-row-full__venue">{{ m.venue_name }}</p>
    {%- endif -%}
    {%- if m.address != blank -%}
      <p class="market-row-full__address">{{ m.address }}</p>
    {%- endif -%}
    {%- if m.notes != blank -%}
      <div class="market-row-full__notes">{{ m.notes }}</div>
    {%- endif -%}
  </div>

  {%- unless past -%}
    <div class="market-row-full__actions">
      {%- if m.google_maps_url != blank -%}
        <a class="market-row-full__link" href="{{ m.google_maps_url }}" target="_blank" rel="noopener">{{ 'markets.view_map' | t }} ↗</a>
      {%- endif -%}
      <button type="button" class="market-row-full__link" data-add-to-calendar>{{ 'markets.add_to_calendar' | t }}</button>
    </div>
  {%- endunless -%}
</li>
```

- [ ] **Step 6.2: Create `assets/section-markets-page.css`**

```css
.markets-page__title { font-size: var(--fs-h1); margin: 4px 0 12px; }
.markets-page__lede { color: rgb(var(--color-ink) / 0.7); max-width: 60ch; margin: 0 0 40px; }

.markets-page__section-title {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  opacity: 0.65;
  margin: 32px 0 16px;
}

.markets-page__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }

.market-row-full {
  display: grid;
  grid-template-columns: 110px 1fr auto;
  gap: 24px;
  align-items: center;
  background: rgb(var(--color-surface));
  border: 1px solid rgb(var(--color-line));
  border-radius: var(--radius-md);
  padding: 24px 28px;
}
.market-row-full--past { opacity: 0.7; }
.market-row-full--empty { display: block; text-align: center; padding: 32px; opacity: 0.6; font-style: italic; }

.market-row-full__date {
  font-family: var(--font-display);
  text-align: center;
  color: rgb(var(--color-blush-deep));
  line-height: 1;
}
.market-row-full__month { display: block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.18em; }
.market-row-full__day { display: block; font-size: 48px; font-weight: 700; margin: 4px 0; }
.market-row-full__year { display: block; font-size: 12px; opacity: 0.7; letter-spacing: 0.1em; }

.market-row-full__name { font-family: var(--font-display); font-size: 22px; color: rgb(var(--color-navy)); margin: 0 0 4px; }
.market-row-full__when,
.market-row-full__venue,
.market-row-full__address { margin: 2px 0; font-size: 14px; color: rgb(var(--color-ink) / 0.78); }
.market-row-full__venue { font-weight: 600; color: rgb(var(--color-ink)); }
.market-row-full__notes { margin-top: 8px; font-size: 13px; color: rgb(var(--color-ink) / 0.65); }

.market-row-full__actions { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
.market-row-full__link {
  background: none;
  border: 0;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  text-decoration: none;
  cursor: pointer;
  padding: 4px 0;
}
.market-row-full__link:hover { color: rgb(var(--color-blush-deep)); }

.markets-page__past { margin-top: 40px; border-top: 1px solid rgb(var(--color-line)); padding-top: 20px; }
.markets-page__past-summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  cursor: pointer;
  list-style: none;
}
.markets-page__past-summary::-webkit-details-marker { display: none; }
.markets-page__past[open] .markets-page__past-summary .icon-chevron-down { transform: rotate(180deg); }
.markets-page__list--past { margin-top: 16px; }

@media (max-width: 720px) {
  .market-row-full { grid-template-columns: 90px 1fr; padding: 20px; }
  .market-row-full__actions { grid-column: 1 / -1; flex-direction: row; align-items: center; gap: 20px; padding-top: 8px; border-top: 1px solid rgb(var(--color-line)); }
}
```

- [ ] **Step 6.3: Commit**

```bash
git add snippets/market-row-full.liquid assets/section-markets-page.css
git commit -m "feat(markets-page): add full market row snippet + page styles"
```

---

## Task 7: Markets page JS — .ics generator + past-markets toggle

**Files:**
- Create: `assets/markets-page.js`

- [ ] **Step 7.1: Create `assets/markets-page.js`**

```javascript
// Markets page: .ics calendar download + (HTML <details> handles past-toggle).
(function () {
  function pad(n) { return String(n).padStart(2, '0'); }

  // Convert "11:00 AM" → { h: 11, m: 0 }
  function parseTime(str) {
    if (!str) return { h: 9, m: 0 };
    const m = String(str).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!m) return { h: 9, m: 0 };
    let h = parseInt(m[1], 10);
    const mm = parseInt(m[2] || '0', 10);
    const ampm = (m[3] || '').toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m: mm };
  }

  // YYYY-MM-DD + { h, m } → "YYYYMMDDTHHMMSS"
  function toIcsLocal(dateStr, timeObj) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    return `${y}${pad(mo)}${pad(d)}T${pad(timeObj.h)}${pad(timeObj.m)}00`;
  }

  function buildIcs(market) {
    const start = toIcsLocal(market.startDate, parseTime(market.startTime));
    const end = toIcsLocal(market.endDate || market.startDate, parseTime(market.endTime));
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const uid = `${market.startDate}-${market.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}@clarkebydesign`;
    const location = [market.venue, market.address].filter(Boolean).join(', ');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Clarke By Design//Markets//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${market.name}`,
      `LOCATION:${location}`,
      'DESCRIPTION:Clarke By Design will be at this market. clarkebydesign3d',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function downloadIcs(market) {
    const blob = new Blob([buildIcs(market)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeName = market.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.querySelectorAll('[data-add-to-calendar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('[data-market]');
      if (!row) return;
      downloadIcs({
        name: row.dataset.name,
        startDate: row.dataset.startDate,
        endDate: row.dataset.endDate,
        startTime: row.dataset.startTime,
        endTime: row.dataset.endTime,
        venue: row.dataset.venue,
        address: row.dataset.address
      });
    });
  });
})();
```

- [ ] **Step 7.2: Test the .ics flow in dev**

```bash
npm run dev
```
Navigate to `/pages/markets`. Click "Add to calendar" on any upcoming event — browser should download an `.ics` file. Open it; macOS Calendar / Outlook / Google Calendar (via "Open with") should accept it and show event name + date + venue.

- [ ] **Step 7.3: Commit**

```bash
git add assets/markets-page.js
git commit -m "feat(markets-page): client-side .ics generator for add-to-calendar"
```

---

## Task 8: Custom Orders page template + hero & steps sections

**Files:**
- Create: `templates/page.custom-orders.json`
- Create: `sections/custom-orders-hero.liquid`
- Create: `sections/custom-orders-steps.liquid`

- [ ] **Step 8.1: Create `templates/page.custom-orders.json`**

```json
{
  "sections": {
    "hero":    { "type": "custom-orders-hero",    "settings": {} },
    "steps":   { "type": "custom-orders-steps",   "settings": {} },
    "form":    { "type": "custom-orders-form",    "settings": {} },
    "gallery": { "type": "custom-orders-gallery", "settings": {} },
    "cta":     { "type": "custom-banner",         "settings": {
      "badge": "Need help deciding?",
      "heading": "Browse the shop",
      "lede": "Or take inspiration from past custom builds below.",
      "cta_label": "Shop bestsellers",
      "cta_url": "/collections/bestsellers"
    } }
  },
  "order": ["hero", "steps", "form", "gallery", "cta"]
}
```

- [ ] **Step 8.2: Create `sections/custom-orders-hero.liquid`**

```liquid
{{ 'section-custom-orders.css' | asset_url | stylesheet_tag }}

<section class="custom-orders-hero section">
  <div class="container custom-orders-hero__inner">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <h1 class="custom-orders-hero__heading">{{ section.settings.heading }}</h1>
    <p class="custom-orders-hero__intro">{{ section.settings.intro }}</p>
  </div>
</section>

{% schema %}
{
  "name": "Custom Orders Hero",
  "settings": [
    { "type": "text",     "id": "eyebrow", "label": "Eyebrow", "default": "custom orders" },
    { "type": "text",     "id": "heading", "label": "Heading", "default": "Got something unique in mind?" },
    { "type": "textarea", "id": "intro",   "label": "Intro paragraph", "default": "Tell me about the piece you're picturing — a name, a colour scheme, a date, a person. I'll come back within 48 hours with a quote and a mockup, and once you approve, I'll make it." }
  ],
  "presets": [ { "name": "Custom Orders Hero" } ]
}
{% endschema %}
```

- [ ] **Step 8.3: Create `sections/custom-orders-steps.liquid`**

```liquid
{{ 'section-custom-orders.css' | asset_url | stylesheet_tag }}

<section class="custom-orders-steps section section--surface">
  <div class="container">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <h2 class="custom-orders-steps__heading">{{ section.settings.heading }}</h2>

    <ol class="custom-orders-steps__list">
      {%- for block in section.blocks -%}
        <li class="custom-step" {{ block.shopify_attributes }}>
          <span class="custom-step__num">{{ forloop.index }}</span>
          <h3 class="custom-step__title">{{ block.settings.title }}</h3>
          <p class="custom-step__body">{{ block.settings.body }}</p>
        </li>
      {%- endfor -%}
    </ol>
  </div>
</section>

{% schema %}
{
  "name": "Custom Orders Steps",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "how it works" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Three steps from idea to delivered" }
  ],
  "blocks": [
    {
      "type": "step",
      "name": "Step",
      "settings": [
        { "type": "text",     "id": "title", "label": "Title" },
        { "type": "textarea", "id": "body",  "label": "Body" }
      ]
    }
  ],
  "max_blocks": 4,
  "presets": [
    {
      "name": "Custom Orders Steps",
      "blocks": [
        { "type": "step", "settings": { "title": "Describe",         "body": "Share what you're picturing — names, colours, occasion. Photos help if you have them." } },
        { "type": "step", "settings": { "title": "Quote within 48h", "body": "I'll come back with a price + rough mockup. No pressure to commit yet." } },
        { "type": "step", "settings": { "title": "Approve & make",   "body": "Once we agree on the design, I get to work in the studio and ship within 1–2 weeks." } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 8.4: Commit**

```bash
git add templates/page.custom-orders.json sections/custom-orders-hero.liquid sections/custom-orders-steps.liquid
git commit -m "feat(custom-orders): scaffold page template + hero + 3-step process sections"
```

---

## Task 9: Custom Orders form section (native Shopify contact form + photo uploads)

**Files:**
- Create: `sections/custom-orders-form.liquid`
- Create: `assets/custom-orders.js`

- [ ] **Step 9.1: Create `sections/custom-orders-form.liquid`**

Uses Shopify's native `{% form 'contact' %}` with `enctype="multipart/form-data"` so up to 5 photos can be uploaded. Shopify's contact form supports file fields when name pattern is `contact[<label>]` and the form has multipart encoding; uploaded files are attached to the email sent to the shop's contact address.

```liquid
{{ 'section-custom-orders.css' | asset_url | stylesheet_tag }}
<script src="{{ 'custom-orders.js' | asset_url }}" defer></script>

<section class="custom-orders-form section">
  <div class="container custom-orders-form__inner">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <h2 class="custom-orders-form__heading">{{ section.settings.heading }}</h2>

    {% form 'contact', id: 'CustomOrderForm', class: 'custom-form', enctype: 'multipart/form-data' %}
      {%- if form.posted_successfully? -%}
        <div class="custom-form__success">
          <h3>{{ section.settings.success_heading }}</h3>
          <p>{{ section.settings.success_body }}</p>
        </div>
      {%- else -%}
        <input type="hidden" name="contact[tags]" value="custom-order-request">
        <input type="hidden" name="contact[Subject]" value="Custom order request">

        <div class="custom-form__row">
          <label for="CustomName">{{ 'custom.fields.name' | t }} <span class="custom-form__req">*</span></label>
          <input type="text" id="CustomName" name="contact[name]" required>
        </div>

        <div class="custom-form__row">
          <label for="CustomEmail">{{ 'custom.fields.email' | t }} <span class="custom-form__req">*</span></label>
          <input type="email" id="CustomEmail" name="contact[email]" required>
        </div>

        <div class="custom-form__row">
          <label for="CustomDesc">{{ 'custom.fields.description' | t }} <span class="custom-form__req">*</span></label>
          <textarea id="CustomDesc" name="contact[Project description]" rows="6" required placeholder="{{ 'custom.fields.description_placeholder' | t }}"></textarea>
        </div>

        <div class="custom-form__row">
          <label for="CustomBudget">{{ 'custom.fields.budget' | t }}</label>
          <select id="CustomBudget" name="contact[Budget]">
            <option value="">{{ 'custom.fields.budget_choose' | t }}</option>
            <option value="Under $30">Under $30</option>
            <option value="$30–$60">$30–$60</option>
            <option value="$60–$120">$60–$120</option>
            <option value="$120–$250">$120–$250</option>
            <option value="$250+">$250+</option>
          </select>
        </div>

        <div class="custom-form__row">
          <label for="CustomDeadline">{{ 'custom.fields.deadline' | t }}</label>
          <input type="date" id="CustomDeadline" name="contact[Deadline]">
        </div>

        <div class="custom-form__row">
          <label>{{ 'custom.fields.photos' | t }}</label>
          <p class="custom-form__hint">{{ 'custom.fields.photos_hint' | t }}</p>
          <div class="custom-form__uploads" data-photo-uploads>
            {%- for i in (1..5) -%}
              <label class="custom-form__upload">
                <input type="file" name="contact[Photo {{ i }}]" accept="image/*" data-photo-input>
                <span class="custom-form__upload-placeholder">+ {{ 'custom.fields.add_photo' | t }}</span>
              </label>
            {%- endfor -%}
          </div>
        </div>

        {%- if form.errors -%}
          <p class="custom-form__error">{{ form.errors | default_errors }}</p>
        {%- endif -%}

        <button type="submit" class="btn btn-primary custom-form__submit">{{ 'custom.fields.submit' | t }}</button>
        <p class="custom-form__legal">{{ section.settings.legal }}</p>
      {%- endif -%}
    {% endform %}
  </div>
</section>

{% schema %}
{
  "name": "Custom Orders Form",
  "settings": [
    { "type": "text",     "id": "eyebrow",         "label": "Eyebrow",         "default": "request a quote" },
    { "type": "text",     "id": "heading",         "label": "Heading",         "default": "Tell me about your idea" },
    { "type": "text",     "id": "success_heading", "label": "Success heading", "default": "Thanks — message received." },
    { "type": "textarea", "id": "success_body",    "label": "Success body",    "default": "I'll come back within 48 hours with a quote and a quick mockup. Keep an eye on your inbox." },
    { "type": "text",     "id": "legal",           "label": "Legal text",      "default": "By submitting you agree to be contacted by Clarke By Design about this request." }
  ],
  "presets": [ { "name": "Custom Orders Form" } ]
}
{% endschema %}
```

- [ ] **Step 9.2: Add custom-form strings to `locales/en.default.json`**

```json
"custom": {
  "fields": {
    "name": "Your name",
    "email": "Email",
    "description": "What are you picturing?",
    "description_placeholder": "Names, colours, the occasion, a date — anything that helps me visualize.",
    "budget": "Budget (optional)",
    "budget_choose": "Choose a range",
    "deadline": "Needed by (optional)",
    "photos": "Reference photos (optional)",
    "photos_hint": "Up to 5 images. JPG / PNG, max ~5 MB each.",
    "add_photo": "Add photo",
    "submit": "Send request"
  }
}
```

- [ ] **Step 9.3: Create `assets/custom-orders.js`**

```javascript
// Custom Orders: show a thumbnail preview after each photo selection.
(function () {
  document.querySelectorAll('[data-photo-input]').forEach((input) => {
    input.addEventListener('change', () => {
      const wrap = input.parentElement; // <label class="custom-form__upload">
      const file = input.files && input.files[0];
      if (!file) return;
      const placeholder = wrap.querySelector('.custom-form__upload-placeholder');
      if (placeholder) placeholder.remove();
      let img = wrap.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.className = 'custom-form__upload-thumb';
        img.alt = '';
        wrap.appendChild(img);
      }
      img.src = URL.createObjectURL(file);
      wrap.classList.add('custom-form__upload--has-file');
    });
  });
})();
```

- [ ] **Step 9.4: Test the form submission**

```bash
npm run dev
```
At `/pages/custom-orders` fill in name + email + description, optionally attach a photo, submit. Expect: Shopify processes the form and shows the success heading. Confirm in Shopify admin → Settings → Notifications that the contact form email was delivered to `clarkebydesign@gmail.com` with the photo attached.

- [ ] **Step 9.5: Commit**

```bash
git add sections/custom-orders-form.liquid assets/custom-orders.js locales/en.default.json
git commit -m "feat(custom-orders): add native contact form with photo uploads + JS thumbnails"
```

---

## Task 10: Custom Orders gallery section + styles

**Files:**
- Create: `sections/custom-orders-gallery.liquid`
- Modify: `assets/section-custom-orders.css` (covers hero, steps, form, gallery)

- [ ] **Step 10.1: Create `sections/custom-orders-gallery.liquid`**

```liquid
{{ 'section-custom-orders.css' | asset_url | stylesheet_tag }}

<section class="custom-orders-gallery section section--surface">
  <div class="container">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <h2 class="custom-orders-gallery__heading">{{ section.settings.heading }}</h2>
    {%- if section.settings.lede != blank -%}
      <p class="custom-orders-gallery__lede">{{ section.settings.lede }}</p>
    {%- endif -%}

    <div class="custom-orders-gallery__grid">
      {%- for block in section.blocks -%}
        <figure class="custom-piece" {{ block.shopify_attributes }}>
          {%- if block.settings.image -%}
            {{ block.settings.image | image_url: width: 600 | image_tag:
               widths: '300, 450, 600',
               sizes: '(min-width: 880px) 33vw, 50vw',
               loading: 'lazy',
               class: 'custom-piece__img' }}
          {%- else -%}
            <div class="custom-piece__placeholder"></div>
          {%- endif -%}
          {%- if block.settings.caption != blank -%}
            <figcaption class="custom-piece__caption">{{ block.settings.caption }}</figcaption>
          {%- endif -%}
        </figure>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Past Custom Pieces",
  "settings": [
    { "type": "text",     "id": "eyebrow", "label": "Eyebrow", "default": "past pieces" },
    { "type": "text",     "id": "heading", "label": "Heading", "default": "A few past custom builds" },
    { "type": "textarea", "id": "lede",    "label": "Lede",    "default": "Borrow an idea, or hand me a totally fresh one." }
  ],
  "blocks": [
    {
      "type": "piece",
      "name": "Piece",
      "settings": [
        { "type": "image_picker", "id": "image",   "label": "Image" },
        { "type": "text",         "id": "caption", "label": "Caption" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [
    {
      "name": "Past Custom Pieces",
      "blocks": [
        { "type": "piece" }, { "type": "piece" }, { "type": "piece" },
        { "type": "piece" }, { "type": "piece" }, { "type": "piece" }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 10.2: Create `assets/section-custom-orders.css`** (covers all four custom-orders sections)

```css
/* --- Hero --- */
.custom-orders-hero__inner { text-align: center; max-width: 680px; }
.custom-orders-hero__heading { font-size: var(--fs-hero); margin: 4px 0 16px; }
.custom-orders-hero__intro { color: rgb(var(--color-ink) / 0.78); font-size: 17px; line-height: 1.6; margin: 0; }

/* --- Steps --- */
.custom-orders-steps__heading { font-size: var(--fs-h2); margin: 4px 0 32px; text-align: center; }
.custom-orders-steps__list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; list-style: none; padding: 0; margin: 0; counter-reset: step; }
.custom-step { background: rgb(var(--color-bg)); border: 1px solid rgb(var(--color-line)); border-radius: var(--radius-md); padding: 28px 24px; }
.custom-step__num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  background: rgb(var(--color-blush));
  color: rgb(var(--color-navy));
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  border-radius: var(--radius-pill);
  margin-bottom: 12px;
}
.custom-step__title { font-size: 22px; margin: 0 0 6px; }
.custom-step__body { font-size: 14px; line-height: 1.55; color: rgb(var(--color-ink) / 0.78); margin: 0; }

/* --- Form --- */
.custom-orders-form__inner { max-width: 640px; }
.custom-orders-form__heading { font-size: var(--fs-h2); margin: 4px 0 24px; }

.custom-form__row { margin-bottom: 18px; }
.custom-form__row label {
  display: block;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  margin-bottom: 6px;
}
.custom-form__req { color: rgb(var(--color-blush-deep)); }
.custom-form__row input[type="text"],
.custom-form__row input[type="email"],
.custom-form__row input[type="date"],
.custom-form__row select,
.custom-form__row textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid rgb(var(--color-line));
  border-radius: var(--radius-md);
  background: rgb(var(--color-surface));
  font-family: var(--font-body);
  font-size: 15px;
  color: rgb(var(--color-ink));
}
.custom-form__row textarea { resize: vertical; min-height: 140px; }
.custom-form__hint { font-size: 12px; opacity: 0.65; margin: -4px 0 8px; }

.custom-form__uploads { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.custom-form__upload {
  position: relative;
  aspect-ratio: 1;
  border: 1.5px dashed rgb(var(--color-line));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background: rgb(var(--color-surface));
}
.custom-form__upload input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.custom-form__upload-placeholder {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  opacity: 0.6;
  text-align: center;
}
.custom-form__upload-thumb { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.custom-form__upload--has-file { border-style: solid; }

.custom-form__submit { margin-top: 8px; width: 100%; }
.custom-form__legal { font-size: 11px; opacity: 0.6; margin: 10px 0 0; text-align: center; }
.custom-form__error { color: #b5392e; font-size: 14px; margin: 8px 0; }
.custom-form__success { background: rgb(var(--color-blush) / 0.4); border-radius: var(--radius-md); padding: 32px; text-align: center; }
.custom-form__success h3 { margin: 0 0 8px; }

/* --- Gallery --- */
.custom-orders-gallery__heading { font-size: var(--fs-h2); margin: 4px 0 8px; }
.custom-orders-gallery__lede { color: rgb(var(--color-ink) / 0.7); margin: 0 0 24px; max-width: 56ch; }
.custom-orders-gallery__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.custom-piece { margin: 0; }
.custom-piece__img,
.custom-piece__placeholder { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-md); display: block; background: linear-gradient(135deg, rgb(var(--color-blush)), rgb(var(--color-birch))); }
.custom-piece__caption { font-family: var(--font-display); font-size: 14px; color: rgb(var(--color-ink) / 0.78); margin: 8px 4px 0; }

@media (max-width: 720px) {
  .custom-orders-steps__list { grid-template-columns: 1fr; }
  .custom-form__uploads { grid-template-columns: repeat(3, 1fr); }
  .custom-orders-gallery__grid { grid-template-columns: 1fr 1fr; }
}
```

- [ ] **Step 10.3: Commit**

```bash
git add sections/custom-orders-gallery.liquid assets/section-custom-orders.css
git commit -m "feat(custom-orders): add past-pieces gallery section + page styles"
```

---

## Task 11: About page template + hero + story sections

**Files:**
- Create: `templates/page.about.json`
- Create: `sections/about-hero.liquid`
- Create: `sections/about-story.liquid`

- [ ] **Step 11.1: Create `templates/page.about.json`**

```json
{
  "sections": {
    "hero":    { "type": "about-hero",    "settings": {} },
    "story":   { "type": "about-story",   "settings": {} },
    "stats":   { "type": "about-stats",   "settings": {} },
    "process": { "type": "about-process", "settings": {} },
    "cta":     { "type": "about-cta",     "settings": {} }
  },
  "order": ["hero", "story", "stats", "process", "cta"]
}
```

- [ ] **Step 11.2: Create `sections/about-hero.liquid`**

```liquid
{{ 'section-about.css' | asset_url | stylesheet_tag }}

<section class="about-hero section">
  <div class="container about-hero__inner">
    <div class="about-hero__portrait">
      {%- if section.settings.portrait -%}
        {{ section.settings.portrait | image_url: width: 720 | image_tag:
           widths: '360, 540, 720',
           sizes: '(min-width: 880px) 40vw, 90vw',
           loading: 'eager',
           class: 'about-hero__img' }}
      {%- else -%}
        <div class="about-hero__placeholder"></div>
      {%- endif -%}
    </div>
    <div class="about-hero__body">
      <p class="eyebrow">{{ section.settings.eyebrow }}</p>
      <h1 class="about-hero__heading">{{ section.settings.heading }}</h1>
      {%- if section.settings.lede != blank -%}
        <p class="about-hero__lede">{{ section.settings.lede }}</p>
      {%- endif -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "About Hero",
  "settings": [
    { "type": "image_picker", "id": "portrait", "label": "Portrait photo" },
    { "type": "text",         "id": "eyebrow",  "label": "Eyebrow", "default": "the maker" },
    { "type": "text",         "id": "heading",  "label": "Heading", "default": "Hi, I'm Marielle." },
    { "type": "textarea",     "id": "lede",     "label": "Lede",    "default": "I run Clarke By Design out of a small studio in Ontario. Every piece is laser-cut or 3D-printed in-house — usually with my kids weighing in on the colours." }
  ],
  "presets": [ { "name": "About Hero" } ]
}
{% endschema %}
```

- [ ] **Step 11.3: Create `sections/about-story.liquid`**

```liquid
{{ 'section-about.css' | asset_url | stylesheet_tag }}

<section class="about-story section section--surface">
  <div class="container about-story__inner">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <h2 class="about-story__heading">{{ section.settings.heading }}</h2>
    <div class="about-story__body rte">
      {{ section.settings.body }}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "About Story",
  "settings": [
    { "type": "text",      "id": "eyebrow", "label": "Eyebrow", "default": "how we got here" },
    { "type": "text",      "id": "heading", "label": "Heading", "default": "From garage hobby to 700+ orders" },
    { "type": "richtext",  "id": "body",    "label": "Body",
      "default": "<p>Clarke By Design started in 2021 with one laser cutter and one stubborn ornament. Five seasons later we've shipped over 700 Etsy orders and met thousands of customers in person at markets across southern Ontario.</p><p>Every piece on this site is designed, cut, painted and packaged in our studio. Most are personalized — a name, a date, a colour scheme — and we treat each one like a small commission. That's the deal: I'd rather make 50 things I love than 500 things I don't.</p>" }
  ],
  "presets": [ { "name": "About Story" } ]
}
{% endschema %}
```

- [ ] **Step 11.4: Commit**

```bash
git add templates/page.about.json sections/about-hero.liquid sections/about-story.liquid
git commit -m "feat(about): scaffold about page template + portrait hero + story sections"
```

---

## Task 12: About stats, process gallery, and footer CTA sections

**Files:**
- Create: `sections/about-stats.liquid`
- Create: `sections/about-process.liquid`
- Create: `sections/about-cta.liquid`

- [ ] **Step 12.1: Create `sections/about-stats.liquid`**

```liquid
{{ 'section-about.css' | asset_url | stylesheet_tag }}

<section class="about-stats section">
  <div class="container about-stats__inner">
    <ul class="about-stats__list">
      {%- for block in section.blocks -%}
        <li class="about-stat" {{ block.shopify_attributes }}>
          <span class="about-stat__value">{{ block.settings.value }}</span>
          <span class="about-stat__label">{{ block.settings.label }}</span>
        </li>
      {%- endfor -%}
    </ul>
  </div>
</section>

{% schema %}
{
  "name": "About Stats",
  "blocks": [
    {
      "type": "stat",
      "name": "Stat",
      "settings": [
        { "type": "text", "id": "value", "label": "Value (e.g. \"1,350+\")" },
        { "type": "text", "id": "label", "label": "Label (e.g. \"items made\")" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [
    {
      "name": "About Stats",
      "blocks": [
        { "type": "stat", "settings": { "value": "1,350+", "label": "items made" } },
        { "type": "stat", "settings": { "value": "700+",   "label": "Etsy orders" } },
        { "type": "stat", "settings": { "value": "20+",    "label": "markets across Ontario" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 12.2: Create `sections/about-process.liquid`**

```liquid
{{ 'section-about.css' | asset_url | stylesheet_tag }}

<section class="about-process section section--surface">
  <div class="container">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <h2 class="about-process__heading">{{ section.settings.heading }}</h2>
    {%- if section.settings.lede != blank -%}
      <p class="about-process__lede">{{ section.settings.lede }}</p>
    {%- endif -%}

    <div class="about-process__grid">
      {%- for block in section.blocks -%}
        <figure class="process-tile" {{ block.shopify_attributes }}>
          {%- if block.settings.image -%}
            {{ block.settings.image | image_url: width: 600 | image_tag:
               widths: '300, 450, 600',
               sizes: '(min-width: 880px) 25vw, 50vw',
               loading: 'lazy',
               class: 'process-tile__img' }}
          {%- else -%}
            <div class="process-tile__placeholder"></div>
          {%- endif -%}
          {%- if block.settings.caption != blank -%}
            <figcaption class="process-tile__caption">{{ block.settings.caption }}</figcaption>
          {%- endif -%}
        </figure>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "About Process",
  "settings": [
    { "type": "text",     "id": "eyebrow", "label": "Eyebrow", "default": "in the studio" },
    { "type": "text",     "id": "heading", "label": "Heading", "default": "How a Clarke piece gets made" },
    { "type": "textarea", "id": "lede",    "label": "Lede",    "default": "Design → cut → assemble → finish. Every step happens in the studio." }
  ],
  "blocks": [
    {
      "type": "image",
      "name": "Process image",
      "settings": [
        { "type": "image_picker", "id": "image",   "label": "Image" },
        { "type": "text",         "id": "caption", "label": "Caption" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [
    {
      "name": "About Process",
      "blocks": [
        { "type": "image", "settings": { "caption": "Design" } },
        { "type": "image", "settings": { "caption": "Cut" } },
        { "type": "image", "settings": { "caption": "Assemble" } },
        { "type": "image", "settings": { "caption": "Pack" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 12.3: Create `sections/about-cta.liquid`**

```liquid
{{ 'section-about.css' | asset_url | stylesheet_tag }}

<section class="about-cta section--navy">
  <div class="container about-cta__inner">
    <h2 class="about-cta__heading">{{ section.settings.heading }}</h2>
    {%- if section.settings.lede != blank -%}
      <p class="about-cta__lede">{{ section.settings.lede }}</p>
    {%- endif -%}
    <div class="about-cta__buttons">
      {%- if section.settings.primary_label != blank -%}
        <a class="btn btn-primary about-cta__btn--blush" href="{{ section.settings.primary_url }}">{{ section.settings.primary_label }}</a>
      {%- endif -%}
      {%- if section.settings.secondary_label != blank -%}
        <a class="btn btn-ghost about-cta__btn--ghost" href="{{ section.settings.secondary_url }}">{{ section.settings.secondary_label }}</a>
      {%- endif -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "About CTA",
  "settings": [
    { "type": "text", "id": "heading",         "label": "Heading",         "default": "Want to see what's in the shop?" },
    { "type": "text", "id": "lede",            "label": "Lede",            "default": "Or hand me your idea and I'll quote it in 48 hours." },
    { "type": "text", "id": "primary_label",   "label": "Primary label",   "default": "Browse the shop" },
    { "type": "url",  "id": "primary_url",     "label": "Primary URL",     "default": "/collections/all" },
    { "type": "text", "id": "secondary_label", "label": "Secondary label", "default": "Request a custom piece" },
    { "type": "url",  "id": "secondary_url",   "label": "Secondary URL",   "default": "/pages/custom-orders" }
  ],
  "presets": [ { "name": "About CTA" } ]
}
{% endschema %}
```

- [ ] **Step 12.4: Commit**

```bash
git add sections/about-stats.liquid sections/about-process.liquid sections/about-cta.liquid
git commit -m "feat(about): add stats row, process gallery, and footer CTA sections"
```

---

## Task 13: About page styles

**Files:**
- Create: `assets/section-about.css`

- [ ] **Step 13.1: Create `assets/section-about.css`**

```css
/* --- Hero --- */
.about-hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 56px;
  align-items: center;
}
.about-hero__portrait { aspect-ratio: 4 / 5; border-radius: var(--radius-lg); overflow: hidden; background: rgb(var(--color-blush) / 0.5); }
.about-hero__img,
.about-hero__placeholder { width: 100%; height: 100%; object-fit: cover; display: block; }
.about-hero__placeholder { background: linear-gradient(135deg, rgb(var(--color-blush)), rgb(var(--color-birch))); }
.about-hero__heading { font-size: var(--fs-hero); margin: 4px 0 16px; }
.about-hero__lede { font-size: 17px; line-height: 1.6; color: rgb(var(--color-ink) / 0.78); margin: 0; }

/* --- Story --- */
.about-story__inner { max-width: 720px; }
.about-story__heading { font-size: var(--fs-h2); margin: 4px 0 20px; }
.about-story__body.rte p { font-size: 17px; line-height: 1.7; margin: 0 0 18px; }
.about-story__body.rte p:last-child { margin-bottom: 0; }

/* --- Stats --- */
.about-stats__inner { max-width: 960px; }
.about-stats__list {
  list-style: none;
  padding: 36px 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  border-top: 1px solid rgb(var(--color-line));
  border-bottom: 1px solid rgb(var(--color-line));
}
.about-stat { text-align: center; }
.about-stat__value {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(32px, 5vw, 52px);
  color: rgb(var(--color-navy));
  font-weight: 700;
  line-height: 1;
}
.about-stat__label {
  display: block;
  font-family: var(--font-body);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgb(var(--color-ink) / 0.65);
  margin-top: 8px;
}

/* --- Process --- */
.about-process__heading { font-size: var(--fs-h2); margin: 4px 0 8px; }
.about-process__lede { color: rgb(var(--color-ink) / 0.7); margin: 0 0 24px; max-width: 56ch; }
.about-process__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.process-tile { margin: 0; }
.process-tile__img,
.process-tile__placeholder { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-md); display: block; background: linear-gradient(135deg, rgb(var(--color-blush)), rgb(var(--color-birch))); }
.process-tile__caption {
  font-family: var(--font-body);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  margin: 8px 4px 0;
  opacity: 0.75;
}

/* --- CTA --- */
.about-cta { padding: var(--space-section) 0; }
.about-cta__inner { text-align: center; max-width: 640px; }
.about-cta__heading { font-size: var(--fs-h1); color: rgb(var(--color-bg)); margin: 0 0 12px; }
.about-cta__lede { color: rgb(var(--color-bg) / 0.85); margin: 0 0 24px; }
.about-cta__buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.about-cta__btn--blush { background: rgb(var(--color-blush)); color: rgb(var(--color-navy)); }
.about-cta__btn--blush:hover { background: rgb(var(--color-blush-deep)); }
.about-cta__btn--ghost { border-color: rgb(var(--color-bg)); color: rgb(var(--color-bg)); }
.about-cta__btn--ghost:hover { background: rgb(var(--color-bg)); color: rgb(var(--color-navy)); }

/* --- Responsive --- */
@media (max-width: 880px) {
  .about-hero__inner { grid-template-columns: 1fr; gap: 24px; }
  .about-process__grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .about-stats__list { grid-template-columns: 1fr; padding: 24px 0; }
}
```

- [ ] **Step 13.2: Smoke-test the About page**

```bash
npm run dev
```
Navigate to `/pages/about`. Expect: portrait sits beside heading on desktop, stacks on mobile, story renders, stats appear in a 3-up row with large Playfair numbers, process gallery in 4-up grid, navy CTA banner at bottom.

- [ ] **Step 13.3: Commit**

```bash
git add assets/section-about.css
git commit -m "feat(about): style hero, story, stats, process, and CTA sections"
```

---

## Task 14: Cross-page smoke test + theme check

**Files:** none

- [ ] **Step 14.1: Run theme check**

```bash
npm run check
```
Expected: no errors. Fix any warnings introduced by new sections (typically: unrecognized filter on metaobject sort, or `image_tag` widths order — adjust as flagged).

- [ ] **Step 14.2: Walk each new template in the preview**

```bash
npm run dev
```
Then in the browser:
- `/collections/all` → grid renders, sort dropdown reloads page, filter sidebar collapses on mobile via the "Filter & Sort" button.
- `/pages/markets` → upcoming events show, "Add to calendar" downloads a valid `.ics`, past markets toggle is collapsed by default.
- `/pages/custom-orders` → hero + 3 steps + form. Submit form with a test photo; confirm success state appears.
- `/pages/about` → portrait, story, 3 stats, 3–4 process tiles, navy CTA.

- [ ] **Step 14.3: Lighthouse mobile spot-check**

In Chrome DevTools, run Lighthouse (mobile, simulated 4G) on `/collections/all` and `/pages/about`. Expect: Performance ≥ 85, Accessibility ≥ 90. Note any regressions to address in Plan 4.

- [ ] **Step 14.4: Push the new templates to the dev store and visually verify**

```bash
npm run push
```
Open the preview URL; click through all four new pages from the header nav.

- [ ] **Step 14.5: Commit any final touch-ups + tag**

```bash
git add -A
git commit -m "chore(plan3): final cross-page polish from smoke test"
git tag v0.3.0-supporting-pages -m "Collection, Markets, Custom Orders, About complete"
git push origin main --tags
```

---

## Self-Review Results

**Spec coverage:**
- §6.1 Collection page — hero + sticky desktop sidebar / mobile drawer, occasion + color + price filters (Storefront Filtering API), sort dropdown (Newest / Best selling / Price asc/desc), 3-up product grid reusing `product-card.liquid` → Tasks 1–4 ✓
- §6.2 Markets page — full upcoming list with large Playfair date + venue + map link + "Add to calendar" `.ics` download, collapsible past markets section → Tasks 5–7 ✓
- §6.3 Custom orders page — hero + 3-step explainer + native Shopify contact form with 5 photo uploads + budget select + deadline date + past-pieces gallery → Tasks 8–10 ✓
- §6.4 About page — portrait hero with Playfair "Hi, I'm Marielle", long-form story, stats row blocks, process gallery, navy footer CTA → Tasks 11–13 ✓

**Plan 1 conventions honored:**
- All CSS uses `rgb(var(--color-*))` brand tokens defined in Plan 1's `assets/base.css` ✓
- BEM-ish class naming (`collection-page__*`, `market-row-full__*`, `custom-form__*`, `about-hero__*`) consistent with Plan 1 (`hero-tile__*`, `site-header__*`) ✓
- Reuses Plan 1's `product-card.liquid` snippet in `collection-grid.liquid` ✓
- Reuses Plan 1's `icon.liquid` for chevron-down and menu icons ✓
- Reuses Plan 1's `market_event` metaobject (Task 9.1 of Plan 1) — no new metaobject needed ✓
- Reuses Plan 1's `section--surface` / `section--navy` utility classes for alternating section backgrounds ✓
- Reuses Plan 1's `custom-banner` section as the final CTA in the Custom Orders template ✓
- Locale strings added to `locales/en.default.json` (Plan 1's locale convention) ✓

**Not covered (intentionally — belongs to later plans):**
- Product page personalization UI (Plan 2)
- Cart drawer / checkout branding (Plan 2 §6.5)
- Performance / a11y final pass + local pickup config + launch checklist (Plan 4)
- French (`fr.json`) translated values (phase 2)

**Placeholder scan:** none — every step has real Liquid / CSS / JS / JSON. Schema defaults are populated so the theme renders meaningful content out of the box even before the owner adds real assets.

**Type consistency:** `data-market`, `data-add-to-calendar`, `data-photo-input`, `data-filters-open`, `data-filters-close`, `data-sort-select` attributes used consistently between Liquid (Tasks 2, 6, 9) and JS (Tasks 4, 7, 9). Metaobject field names (`start_date`, `start_time`, `venue_name`, `google_maps_url`, `notes`) match Plan 1 Task 9.1's metaobject definition exactly.

**Task count:** 14 tasks, ~45 steps, every step has runnable code or a single concrete admin click-path. No "fill in details" stubs.

Plan complete.
