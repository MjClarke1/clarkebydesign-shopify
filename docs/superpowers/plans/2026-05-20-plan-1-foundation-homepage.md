# Plan 1 — Foundation + Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Shopify theme based on Dawn, branded to the locked palette + typography, with a complete editable homepage (all sections from spec §4), header, footer, and markets metaobject. After this plan, the owner has a deployable themed storefront — no product page work yet, products will use Dawn's default for now.

**Architecture:** Fork Dawn (Shopify's official Online Store 2.0 reference theme), strip its visual styling, apply Clarke By Design brand tokens via CSS custom properties in `assets/base.css`, replace its homepage sections with eight purpose-built sections matching spec §4, configure header/footer to the locked design. Markets and reviews use Shopify metaobjects for content management. No JS frameworks — vanilla Liquid + plain JS only.

**Tech Stack:**
- Shopify Online Store 2.0 (sections + blocks + metaobjects)
- Liquid templating
- Vanilla JS (ES modules)
- CSS custom properties (no preprocessor)
- Google Fonts: Playfair Display + Inter
- Shopify CLI (`@shopify/cli`, `@shopify/theme`) for local dev
- Theme Check (`shopify theme check`) for linting

---

## File Structure

```
.
├── assets/
│   ├── base.css                       # Brand tokens, resets, base typography, utility classes
│   ├── header.css                     # Header styles
│   ├── footer.css                     # Footer styles
│   ├── section-hero-tiles.css         # Hero category tiles
│   ├── section-occasion-tiles.css     # Reused style for occasion tiles
│   ├── section-product-row.css        # Bestsellers + reusable product rows
│   ├── section-custom-banner.css      # Navy custom-orders banner
│   ├── section-featured-reviews.css   # Reviews carousel
│   ├── section-markets-list.css       # Markets list section
│   ├── section-instagram-strip.css    # Instagram grid
│   ├── section-newsletter.css         # Newsletter signup
│   ├── theme.js                       # Tiny global JS (cart drawer trigger, nav, etc.)
│   └── icons.svg                      # Sprite of SVG icons (search, cart, heart, chevron, social)
├── config/
│   ├── settings_schema.json           # Theme settings (colors, fonts, social URLs, etc.)
│   └── settings_data.json             # Defaults
├── layout/
│   └── theme.liquid                   # Base HTML layout
├── locales/
│   ├── en.default.json                # English strings
│   └── fr.json                        # French placeholder (empty values)
├── sections/
│   ├── header.liquid
│   ├── footer.liquid
│   ├── hero-tiles.liquid
│   ├── occasion-tiles.liquid
│   ├── product-row.liquid
│   ├── custom-banner.liquid
│   ├── featured-reviews.liquid
│   ├── markets-list.liquid
│   ├── instagram-strip.liquid
│   └── newsletter.liquid
├── snippets/
│   ├── icon.liquid                    # SVG icon include
│   ├── product-card.liquid            # Reused product card
│   └── nav-mega-menu.liquid           # Shop two-column dropdown
├── templates/
│   └── index.json                     # Homepage section ordering
├── .shopifyignore                     # Files to exclude from theme push
└── package.json                       # Dev scripts
```

---

## Pre-flight: tools the owner needs once

Before any task: install Shopify CLI and create a dev store. These steps are one-time.

- [ ] **Step P1: Install Node 20 LTS and Shopify CLI globally**

```bash
# In PowerShell as admin (Windows)
winget install OpenJS.NodeJS.LTS
npm install -g @shopify/cli @shopify/theme
shopify version
```
Expected: prints `@shopify/cli/3.x.x`.

- [ ] **Step P2: Create a Shopify development store**

Sign in at https://partners.shopify.com → Stores → Add store → Development store.
Name: `clarkebydesign-dev`. Note the store URL (e.g. `clarkebydesign-dev.myshopify.com`).

- [ ] **Step P3: Authenticate Shopify CLI to the dev store**

```bash
cd "d:/WarpForged Terrain/ClarkeByDesign Shopify"
shopify auth login --store clarkebydesign-dev.myshopify.com
```
Expected: opens browser, completes auth, returns to CLI.

---

## Task 1: Initialize theme from Dawn

**Files:**
- Create: `package.json`
- Create: `.shopifyignore`
- Pull in: full Dawn theme tree (assets/, config/, layout/, locales/, sections/, snippets/, templates/)

- [ ] **Step 1.1: Pull the latest Dawn release into the repo root**

```bash
cd "d:/WarpForged Terrain/ClarkeByDesign Shopify"
shopify theme init clarkebydesign --clone-url https://github.com/Shopify/dawn.git
# Move contents up one level
mv clarkebydesign/* clarkebydesign/.* . 2>/dev/null
rmdir clarkebydesign
rm -rf .git # Re-init since Dawn's history is irrelevant
git init -b main
git add -A
git commit -m "chore: import Dawn theme as starting point"
```
Expected: `assets/`, `config/`, `layout/`, etc. exist at repo root.

- [ ] **Step 1.2: Create a minimal `package.json` with dev scripts**

```json
{
  "name": "clarkebydesign-shopify",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "shopify theme dev",
    "check": "shopify theme check",
    "push": "shopify theme push --unpublished",
    "publish": "shopify theme push --live"
  }
}
```

- [ ] **Step 1.3: Create `.shopifyignore`**

```
node_modules/
.superpowers/
docs/
.git/
*.md
.gitignore
.shopifyignore
package.json
package-lock.json
```

- [ ] **Step 1.4: Smoke-test local dev**

```bash
npm run dev
```
Expected: opens browser at `https://*.trycloudflare.com/?preview_theme_id=...`. You should see Dawn's default homepage (unstyled-for-us). Stop the server with Ctrl-C.

- [ ] **Step 1.5: Run theme check**

```bash
npm run check
```
Expected: PASS or only warnings. No fatal errors. Note any warnings — we'll resolve them as files change.

- [ ] **Step 1.6: Commit**

```bash
git add package.json .shopifyignore
git commit -m "chore: add dev tooling scripts and shopifyignore"
```

---

## Task 2: Strip Dawn's homepage and prepare for Clarke sections

**Files:**
- Modify: `templates/index.json`
- Delete (move to `_dawn-archive/`): Dawn's homepage-specific sections we're replacing

- [ ] **Step 2.1: Archive Dawn homepage sections we're replacing**

```bash
mkdir _dawn-archive
mv sections/image-banner.liquid _dawn-archive/ 2>/dev/null
mv sections/featured-collection.liquid _dawn-archive/ 2>/dev/null
mv sections/multicolumn.liquid _dawn-archive/ 2>/dev/null
mv sections/rich-text.liquid _dawn-archive/ 2>/dev/null
mv sections/collection-list.liquid _dawn-archive/ 2>/dev/null
mv sections/newsletter.liquid _dawn-archive/ 2>/dev/null
```
(We'll rebuild `newsletter.liquid` ourselves in Task 12.)

- [ ] **Step 2.2: Replace `templates/index.json` with our skeleton**

```json
{
  "sections": {
    "hero": { "type": "hero-tiles", "settings": {} },
    "occasion": { "type": "occasion-tiles", "settings": {} },
    "bestsellers": { "type": "product-row", "settings": { "heading": "Bestsellers", "collection": "bestsellers" } },
    "custom_banner": { "type": "custom-banner", "settings": {} },
    "reviews": { "type": "featured-reviews", "settings": {} },
    "markets": { "type": "markets-list", "settings": { "limit": 3, "show_link_to_all": true } },
    "instagram": { "type": "instagram-strip", "settings": {} },
    "newsletter": { "type": "newsletter", "settings": {} }
  },
  "order": ["hero", "occasion", "bestsellers", "custom_banner", "reviews", "markets", "instagram", "newsletter"]
}
```

- [ ] **Step 2.3: Run dev and confirm it errors on missing sections**

```bash
npm run dev
```
Expected: page loads but shows errors for missing `hero-tiles`, etc. That's the right state — we'll fill them in.

- [ ] **Step 2.4: Commit**

```bash
git add templates/index.json _dawn-archive/
git commit -m "chore: archive Dawn homepage sections, scaffold Clarke homepage in index.json"
```

---

## Task 3: Brand tokens and base typography

**Files:**
- Modify: `assets/base.css` (replace head section with our tokens; keep rest of Dawn's resets for now)
- Modify: `layout/theme.liquid` (load Google Fonts, swap font references)
- Modify: `config/settings_schema.json` (expose colors + fonts as theme settings)

- [ ] **Step 3.1: Open `assets/base.css` and replace the `:root` block at the very top with our tokens**

Replace the existing `:root { ... }` declaration (around lines 1-50) with:

```css
:root {
  /* Palette — locked from spec §2.2 */
  --color-bg: 248 241 231;        /* #F8F1E7 cream */
  --color-surface: 255 255 255;
  --color-blush: 234 200 194;     /* #EAC8C2 */
  --color-blush-deep: 217 168 159; /* #D9A89F */
  --color-navy: 20 42 68;         /* #142A44 — primary, from logo */
  --color-birch: 182 138 101;     /* #B68A65 */
  --color-ink: 31 26 21;          /* #1F1A15 */
  --color-line: 20 42 68 / 0.12;

  /* Type — locked from spec §2.3 */
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display-weight: 600;
  --font-body-weight: 400;

  /* Spacing rhythm */
  --space-section: clamp(40px, 8vw, 96px);
  --space-block: 24px;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;

  /* Type scale (responsive via clamp) */
  --fs-eyebrow: 11px;
  --fs-body: 15px;
  --fs-h3: clamp(18px, 2.2vw, 22px);
  --fs-h2: clamp(22px, 3vw, 32px);
  --fs-h1: clamp(28px, 5vw, 48px);
  --fs-hero: clamp(36px, 6vw, 56px);
}

body {
  background: rgb(var(--color-bg));
  color: rgb(var(--color-ink));
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: 1.55;
  margin: 0;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  color: rgb(var(--color-navy));
  line-height: 1.1;
  margin: 0 0 var(--space-block);
}

.eyebrow {
  display: block;
  font-size: var(--fs-eyebrow);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  opacity: 0.65;
  font-weight: 600;
  margin-bottom: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  border: 0;
  transition: opacity 0.15s, transform 0.15s;
}
.btn-primary { background: rgb(var(--color-navy)); color: rgb(var(--color-bg)); }
.btn-primary:hover { opacity: 0.92; }
.btn-ghost {
  background: transparent;
  color: rgb(var(--color-navy));
  border: 1.5px solid rgb(var(--color-navy));
}
.btn-ghost:hover { background: rgb(var(--color-navy)); color: rgb(var(--color-bg)); }

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 48px);
}

.section { padding-top: var(--space-section); padding-bottom: var(--space-section); }
.section--surface { background: rgb(var(--color-surface)); }
.section--navy { background: rgb(var(--color-navy)); color: rgb(var(--color-bg)); }
.section--navy h1, .section--navy h2, .section--navy h3 { color: rgb(var(--color-bg)); }
.section--navy .eyebrow { color: rgb(var(--color-bg)); opacity: 0.7; }

*:focus-visible {
  outline: 2px solid rgb(var(--color-navy));
  outline-offset: 2px;
  border-radius: 4px;
}
```

- [ ] **Step 3.2: In `layout/theme.liquid`, swap the Google Fonts link tags**

Find the existing `<link rel="stylesheet" href="...font...">` block (around lines 50-70 of Dawn's `theme.liquid`) and replace with:

```liquid
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3.3: In `config/settings_schema.json`, expose the palette tokens as settings**

Open `config/settings_schema.json` and find the `"colors"` schema (Dawn ships one). Replace it with:

```json
{
  "name": "Colors",
  "settings": [
    { "type": "color", "id": "color_bg",         "label": "Background",       "default": "#F8F1E7" },
    { "type": "color", "id": "color_blush",      "label": "Blush accent",     "default": "#EAC8C2" },
    { "type": "color", "id": "color_blush_deep", "label": "Blush deep",       "default": "#D9A89F" },
    { "type": "color", "id": "color_navy",       "label": "Navy primary",     "default": "#142A44" },
    { "type": "color", "id": "color_birch",      "label": "Birch wood",       "default": "#B68A65" },
    { "type": "color", "id": "color_ink",        "label": "Ink text",         "default": "#1F1A15" }
  ]
}
```

Then in `layout/theme.liquid` immediately before `</head>`, render these as CSS overrides so the theme editor controls them:

```liquid
<style>
  :root {
    --color-bg: {{ settings.color_bg | color_extract: 'red' }} {{ settings.color_bg | color_extract: 'green' }} {{ settings.color_bg | color_extract: 'blue' }};
    --color-blush: {{ settings.color_blush | color_extract: 'red' }} {{ settings.color_blush | color_extract: 'green' }} {{ settings.color_blush | color_extract: 'blue' }};
    --color-blush-deep: {{ settings.color_blush_deep | color_extract: 'red' }} {{ settings.color_blush_deep | color_extract: 'green' }} {{ settings.color_blush_deep | color_extract: 'blue' }};
    --color-navy: {{ settings.color_navy | color_extract: 'red' }} {{ settings.color_navy | color_extract: 'green' }} {{ settings.color_navy | color_extract: 'blue' }};
    --color-birch: {{ settings.color_birch | color_extract: 'red' }} {{ settings.color_birch | color_extract: 'green' }} {{ settings.color_birch | color_extract: 'blue' }};
    --color-ink: {{ settings.color_ink | color_extract: 'red' }} {{ settings.color_ink | color_extract: 'green' }} {{ settings.color_ink | color_extract: 'blue' }};
  }
</style>
```

- [ ] **Step 3.4: Verify in dev that fonts load and colors apply**

```bash
npm run dev
```
Open the preview URL. The default body text should now be in Inter, headings will eventually be Playfair, page background should be `#F8F1E7` cream.

- [ ] **Step 3.5: Commit**

```bash
git add assets/base.css layout/theme.liquid config/settings_schema.json
git commit -m "feat(brand): add Clarke palette tokens and Playfair+Inter typography"
```

---

## Task 4: Header section

**Files:**
- Create/modify: `sections/header.liquid` (replace Dawn's wholesale)
- Create: `assets/header.css`
- Create: `snippets/icon.liquid` and `assets/icons.svg`
- Modify: `locales/en.default.json` (add nav strings)

- [ ] **Step 4.1: Create `assets/icons.svg` with the SVG icon sprite**

```xml
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="icon-search" viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  <symbol id="icon-heart" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>
  <symbol id="icon-bag" viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7zM9 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="icon-chevron-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="icon-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  <symbol id="icon-instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></symbol>
</svg>
```

- [ ] **Step 4.2: Create `snippets/icon.liquid`**

```liquid
{% comment %}
  Usage: {% render 'icon', name: 'search', size: 22 %}
{% endcomment %}
{%- assign size = size | default: 22 -%}
<svg width="{{ size }}" height="{{ size }}" aria-hidden="true" class="icon icon-{{ name }}"><use href="#icon-{{ name }}"/></svg>
```

In `layout/theme.liquid`, immediately after `<body>` opening tag, inline-include the sprite:

```liquid
{% render 'icons-sprite' %}
```

Create `snippets/icons-sprite.liquid` containing the sprite SVG from Step 4.1.

- [ ] **Step 4.3: Create `sections/header.liquid`**

Full replacement (overwrite Dawn's `header.liquid` entirely):

```liquid
{{ 'header.css' | asset_url | stylesheet_tag }}

<header class="site-header" role="banner">
  <div class="container site-header__inner">
    <a class="site-header__logo" href="{{ routes.root_url }}">
      {% if section.settings.logo %}
        {{ section.settings.logo | image_url: width: 360 | image_tag: alt: shop.name, widths: '120, 240, 360', class: 'site-header__logo-img' }}
      {% else %}
        <span class="site-header__wordmark">CLARKE <span>BY DESIGN</span></span>
      {% endif %}
    </a>

    <nav class="site-header__nav" aria-label="Primary">
      <ul class="site-header__nav-list">
        {%- for link in linklists.main-menu.links -%}
          {% if link.links.size > 0 %}
            <li class="site-header__nav-item has-dropdown">
              <button class="site-header__nav-link" aria-haspopup="true" aria-expanded="false">
                {{ link.title }} {% render 'icon', name: 'chevron-down', size: 12 %}
              </button>
              {% render 'nav-mega-menu', link: link %}
            </li>
          {% else %}
            <li class="site-header__nav-item">
              <a class="site-header__nav-link" href="{{ link.url }}">{{ link.title }}</a>
            </li>
          {% endif %}
        {%- endfor -%}
      </ul>
    </nav>

    <div class="site-header__utils">
      <a href="{{ routes.search_url }}" class="site-header__icon-btn" aria-label="{{ 'general.search.search' | t }}">
        {% render 'icon', name: 'search' %}
      </a>
      <a href="/pages/wishlist" class="site-header__icon-btn" aria-label="Wishlist">
        {% render 'icon', name: 'heart' %}
      </a>
      <a href="{{ routes.cart_url }}" class="site-header__icon-btn site-header__cart" aria-label="Cart">
        {% render 'icon', name: 'bag' %}
        <span class="site-header__cart-count" data-cart-count>{{ cart.item_count }}</span>
      </a>
      <button class="site-header__icon-btn site-header__menu-btn" aria-label="Open menu" data-mobile-menu-toggle>
        {% render 'icon', name: 'menu' %}
      </button>
    </div>
  </div>
</header>

{% schema %}
{
  "name": "Header",
  "settings": [
    { "type": "image_picker", "id": "logo", "label": "Logo (SVG or PNG)" }
  ]
}
{% endschema %}
```

- [ ] **Step 4.4: Create `snippets/nav-mega-menu.liquid`**

For the **Shop** menu, we render a two-column dropdown (By Category / By Occasion). The link list grouping is by Shopify menu structure — under the "Shop" parent, top-level child links act as column headings, and their grand-children become the items.

```liquid
{%- comment -%} Renders a two-column mega-menu for any link with sub-links {%- endcomment -%}
<div class="mega-menu" role="menu">
  <div class="mega-menu__inner container">
    {%- for col in link.links -%}
      <div class="mega-menu__col">
        <h4 class="mega-menu__col-title">{{ col.title }}</h4>
        <ul class="mega-menu__col-list">
          {%- for sub in col.links -%}
            <li><a href="{{ sub.url }}">{{ sub.title }}</a></li>
          {%- endfor -%}
          {%- if col.links.size == 0 -%}
            <li><a href="{{ col.url }}">{{ col.title }}</a></li>
          {%- endif -%}
        </ul>
      </div>
    {%- endfor -%}
  </div>
</div>
```

- [ ] **Step 4.5: Create `assets/header.css`**

```css
.site-header {
  background: rgb(var(--color-bg));
  border-bottom: 1px solid rgb(var(--color-line));
  position: sticky;
  top: 0;
  z-index: 100;
}
.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  gap: 24px;
}
.site-header__logo {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: rgb(var(--color-navy));
}
.site-header__logo-img { height: 36px; width: auto; }
.site-header__wordmark {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 0.04em;
}
.site-header__wordmark span {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 10px;
  letter-spacing: 0.3em;
  margin-left: 6px;
  text-transform: uppercase;
}

.site-header__nav-list {
  display: flex;
  gap: 28px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.site-header__nav-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 0;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  text-decoration: none;
  cursor: pointer;
  padding: 8px 0;
}
.site-header__nav-item.has-dropdown { position: relative; }
.mega-menu {
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  background: rgb(var(--color-bg));
  border: 1px solid rgb(var(--color-line));
  border-radius: var(--radius-md);
  padding: 28px 36px;
  display: none;
  min-width: 480px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.08);
}
.site-header__nav-item.has-dropdown:hover .mega-menu,
.site-header__nav-item.has-dropdown:focus-within .mega-menu { display: block; }
.mega-menu__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  padding: 0;
}
.mega-menu__col-title {
  font-family: var(--font-body);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  opacity: 0.6;
  margin: 0 0 12px;
}
.mega-menu__col-list { list-style: none; padding: 0; margin: 0; }
.mega-menu__col-list li { margin-bottom: 8px; }
.mega-menu__col-list a {
  font-family: var(--font-display);
  font-size: 17px;
  color: rgb(var(--color-navy));
  text-decoration: none;
}
.mega-menu__col-list a:hover { color: rgb(var(--color-blush-deep)); }

.site-header__utils {
  display: flex;
  align-items: center;
  gap: 8px;
}
.site-header__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px; height: 40px;
  background: none;
  border: 0;
  color: rgb(var(--color-navy));
  border-radius: var(--radius-pill);
  cursor: pointer;
  position: relative;
  text-decoration: none;
}
.site-header__icon-btn:hover { background: rgb(var(--color-blush) / 0.4); }
.site-header__cart-count {
  position: absolute;
  top: 6px; right: 4px;
  background: rgb(var(--color-navy));
  color: rgb(var(--color-bg));
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
}
.site-header__menu-btn { display: none; }

@media (max-width: 880px) {
  .site-header__nav { display: none; }
  .site-header__menu-btn { display: inline-flex; }
}
```

- [ ] **Step 4.6: Smoke-test in dev**

```bash
npm run dev
```
Confirm: header sticks to top, logo wordmark renders in correct fonts, nav items show on desktop, mega-menu opens on hover for a parent link with children, icons render, cart count shows `0`.

- [ ] **Step 4.7: Commit**

```bash
git add sections/header.liquid snippets/nav-mega-menu.liquid snippets/icon.liquid snippets/icons-sprite.liquid assets/header.css assets/icons.svg layout/theme.liquid
git commit -m "feat(header): build branded header with mega-menu and utility nav"
```

---

## Task 5: Hero Tiles section

**Files:**
- Create: `sections/hero-tiles.liquid`
- Create: `assets/section-hero-tiles.css`

- [ ] **Step 5.1: Create `sections/hero-tiles.liquid`**

```liquid
{{ 'section-hero-tiles.css' | asset_url | stylesheet_tag }}

<section class="hero-tiles section">
  <div class="container">
    {%- if section.settings.eyebrow != blank -%}
      <p class="eyebrow hero-tiles__eyebrow">{{ section.settings.eyebrow }}</p>
    {%- endif -%}
    {%- if section.settings.heading != blank -%}
      <h1 class="hero-tiles__heading">{{ section.settings.heading }}</h1>
    {%- endif -%}
    {%- if section.settings.sub != blank -%}
      <p class="hero-tiles__sub">{{ section.settings.sub }}</p>
    {%- endif -%}

    <div class="hero-tiles__grid">
      {%- for block in section.blocks -%}
        <a class="hero-tile" href="{{ block.settings.link }}" {{ block.shopify_attributes }}>
          {%- if block.settings.image -%}
            {{ block.settings.image | image_url: width: 800 | image_tag:
               widths: '320, 480, 640, 800',
               sizes: '(min-width: 880px) 25vw, (min-width: 600px) 50vw, 100vw',
               loading: 'eager',
               class: 'hero-tile__img' }}
          {%- endif -%}
          <div class="hero-tile__overlay"></div>
          <div class="hero-tile__body">
            <span class="hero-tile__label">{{ block.settings.label }}</span>
            {%- if block.settings.sub != blank -%}
              <span class="hero-tile__sub">{{ block.settings.sub }}</span>
            {%- endif -%}
          </div>
        </a>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Hero — Category Tiles",
  "settings": [
    { "type": "text",     "id": "eyebrow", "label": "Eyebrow",  "default": "handmade in ontario" },
    { "type": "text",     "id": "heading", "label": "Heading",  "default": "Personalized gifts, made just for you." },
    { "type": "text",     "id": "sub",     "label": "Subhead",  "default": "Browse a category to get started." }
  ],
  "blocks": [
    {
      "type": "tile",
      "name": "Tile",
      "limit": 6,
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "text",         "id": "label", "label": "Label",    "default": "Keychains" },
        { "type": "text",         "id": "sub",   "label": "Subtitle", "default": "120+ designs" },
        { "type": "url",          "id": "link",  "label": "Link" }
      ]
    }
  ],
  "max_blocks": 6,
  "presets": [
    {
      "name": "Hero Tiles",
      "blocks": [
        { "type": "tile", "settings": { "label": "Keychains", "sub": "120+ designs" } },
        { "type": "tile", "settings": { "label": "Ornaments", "sub": "Christmas · Easter" } },
        { "type": "tile", "settings": { "label": "Teacher Gifts", "sub": "Mrs. ___" } },
        { "type": "tile", "settings": { "label": "Custom", "sub": "Request a Piece" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 5.2: Create `assets/section-hero-tiles.css`**

```css
.hero-tiles__eyebrow { text-align: center; margin-bottom: 4px; }
.hero-tiles__heading {
  font-size: var(--fs-hero);
  text-align: center;
  margin: 0 auto 8px;
  max-width: 16ch;
}
.hero-tiles__sub {
  text-align: center;
  color: rgb(var(--color-ink) / 0.7);
  margin: 0 auto var(--space-block);
  max-width: 48ch;
}
.hero-tiles__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 24px;
}
.hero-tile {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: block;
  color: #fff;
  text-decoration: none;
  background: rgb(var(--color-birch));
}
.hero-tile__img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}
.hero-tile__overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55));
}
.hero-tile__body {
  position: absolute; left: 16px; right: 16px; bottom: 16px;
  display: flex; flex-direction: column; gap: 4px;
}
.hero-tile__label {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.4vw, 28px);
  line-height: 1;
}
.hero-tile__sub {
  font-family: var(--font-body);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.9;
}

@media (max-width: 880px) { .hero-tiles__grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .hero-tiles__grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 5.3: Test in dev**

```bash
npm run dev
```
Confirm: hero section renders. With no images uploaded yet, tiles show as birch-colored blocks with labels. Resize browser to verify the 4 → 2 → 1 responsive grid.

- [ ] **Step 5.4: Commit**

```bash
git add sections/hero-tiles.liquid assets/section-hero-tiles.css
git commit -m "feat(home): add hero category tiles section"
```

---

## Task 6: Occasion Tiles section

**Files:**
- Create: `sections/occasion-tiles.liquid`
- Create: `assets/section-occasion-tiles.css`

- [ ] **Step 6.1: Create `sections/occasion-tiles.liquid`**

```liquid
{{ 'section-occasion-tiles.css' | asset_url | stylesheet_tag }}

<section class="occasion-tiles section section--surface">
  <div class="container">
    {%- if section.settings.eyebrow != blank -%}
      <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    {%- endif -%}
    <h2 class="occasion-tiles__heading">{{ section.settings.heading }}</h2>
    {%- if section.settings.lede != blank -%}
      <p class="occasion-tiles__lede">{{ section.settings.lede }}</p>
    {%- endif -%}

    <div class="occasion-tiles__grid">
      {%- for block in section.blocks -%}
        <a class="occasion-tile" href="{{ block.settings.link }}" {{ block.shopify_attributes }}>
          {%- if block.settings.image -%}
            {{ block.settings.image | image_url: width: 600 | image_tag:
               widths: '300, 450, 600',
               sizes: '(min-width: 880px) 25vw, 50vw',
               loading: 'lazy',
               class: 'occasion-tile__img' }}
          {%- endif -%}
          <div class="occasion-tile__overlay"></div>
          <span class="occasion-tile__label">{{ block.settings.label }}</span>
        </a>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Shop by Occasion",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "shop by occasion" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "What's the moment?" },
    { "type": "text", "id": "lede",    "label": "Lede",    "default": "Gifts grouped for the day you're shopping for." }
  ],
  "blocks": [
    {
      "type": "tile",
      "name": "Occasion",
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "text",         "id": "label", "label": "Label" },
        { "type": "url",          "id": "link",  "label": "Link" }
      ]
    }
  ],
  "max_blocks": 8,
  "presets": [
    {
      "name": "Shop by Occasion",
      "blocks": [
        { "type": "tile", "settings": { "label": "Birthday" } },
        { "type": "tile", "settings": { "label": "Christmas" } },
        { "type": "tile", "settings": { "label": "Baby & Kids" } },
        { "type": "tile", "settings": { "label": "Teacher" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 6.2: Create `assets/section-occasion-tiles.css`**

```css
.occasion-tiles__heading { font-size: var(--fs-h2); margin-bottom: 4px; }
.occasion-tiles__lede { color: rgb(var(--color-ink) / 0.7); margin-bottom: 32px; max-width: 56ch; }
.occasion-tiles__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.occasion-tile {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: block;
  color: #fff;
  text-decoration: none;
  background: rgb(var(--color-blush));
}
.occasion-tile__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.occasion-tile__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.45)); }
.occasion-tile__label {
  position: absolute; left: 16px; right: 16px; bottom: 14px;
  font-family: var(--font-display);
  font-size: clamp(16px, 2vw, 22px);
}
@media (max-width: 880px) { .occasion-tiles__grid { grid-template-columns: 1fr 1fr; } }
```

- [ ] **Step 6.3: Test and commit**

```bash
npm run dev   # visual check
git add sections/occasion-tiles.liquid assets/section-occasion-tiles.css
git commit -m "feat(home): add Shop by Occasion tiles section"
```

---

## Task 7: Product card snippet + Product Row section

**Files:**
- Create: `snippets/product-card.liquid`
- Create: `sections/product-row.liquid`
- Create: `assets/section-product-row.css`

- [ ] **Step 7.1: Create `snippets/product-card.liquid`**

```liquid
{%- comment -%}
  Usage: {% render 'product-card', product: product %}
{%- endcomment -%}
<a class="product-card" href="{{ product.url }}">
  <div class="product-card__media">
    {%- if product.featured_image -%}
      {{ product.featured_image | image_url: width: 600 | image_tag:
         widths: '300, 450, 600',
         sizes: '(min-width: 880px) 25vw, 50vw',
         loading: 'lazy',
         class: 'product-card__img' }}
    {%- else -%}
      <div class="product-card__img product-card__img--placeholder"></div>
    {%- endif -%}
  </div>
  <div class="product-card__body">
    <h3 class="product-card__title">{{ product.title | escape }}</h3>
    <p class="product-card__price">
      {%- if product.price_varies -%}
        From {{ product.price_min | money }}
      {%- else -%}
        {{ product.price | money }}
      {%- endif -%}
    </p>
  </div>
</a>
```

- [ ] **Step 7.2: Create `sections/product-row.liquid`**

```liquid
{{ 'section-product-row.css' | asset_url | stylesheet_tag }}

<section class="product-row section">
  <div class="container">
    {%- if section.settings.eyebrow != blank -%}
      <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    {%- endif -%}
    <div class="product-row__head">
      <h2 class="product-row__heading">{{ section.settings.heading }}</h2>
      {%- if section.settings.link_label != blank and section.settings.link_url != blank -%}
        <a class="product-row__link" href="{{ section.settings.link_url }}">{{ section.settings.link_label }} →</a>
      {%- endif -%}
    </div>

    {%- assign coll = collections[section.settings.collection] -%}
    <div class="product-row__grid">
      {%- for product in coll.products limit: section.settings.product_count -%}
        {% render 'product-card', product: product %}
      {%- else -%}
        {%- for i in (1..section.settings.product_count) -%}
          <div class="product-card product-card--placeholder">
            <div class="product-card__media"><div class="product-card__img product-card__img--placeholder"></div></div>
            <div class="product-card__body">
              <h3 class="product-card__title">Sample Product</h3>
              <p class="product-card__price">$14.00</p>
            </div>
          </div>
        {%- endfor -%}
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Product Row",
  "settings": [
    { "type": "text",                "id": "eyebrow",       "label": "Eyebrow",    "default": "bestsellers" },
    { "type": "text",                "id": "heading",       "label": "Heading",    "default": "What everyone's ordering" },
    { "type": "collection",          "id": "collection",    "label": "Collection" },
    { "type": "range",               "id": "product_count", "label": "Number of products", "min": 2, "max": 8, "step": 1, "default": 4 },
    { "type": "text",                "id": "link_label",    "label": "Link label (optional)", "default": "Shop all" },
    { "type": "url",                 "id": "link_url",      "label": "Link URL" }
  ],
  "presets": [
    { "name": "Product Row" }
  ]
}
{% endschema %}
```

- [ ] **Step 7.3: Create `assets/section-product-row.css`**

```css
.product-row__head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px; }
.product-row__heading { font-size: var(--fs-h2); margin: 0; }
.product-row__link {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  text-decoration: none;
}
.product-row__link:hover { color: rgb(var(--color-blush-deep)); }

.product-row__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 880px) { .product-row__grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .product-row__grid { grid-template-columns: 1fr; } }

.product-card { display: block; text-decoration: none; color: inherit; }
.product-card__media {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgb(var(--color-blush) / 0.4);
}
.product-card__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.product-card__img--placeholder { background: linear-gradient(135deg, rgb(var(--color-blush)), rgb(var(--color-blush-deep))); }
.product-card__body { padding: 10px 4px 0; }
.product-card__title {
  font-family: var(--font-display);
  font-size: var(--fs-h3);
  color: rgb(var(--color-navy));
  font-weight: 600;
  margin: 0 0 4px;
  line-height: 1.2;
}
.product-card__price { font-family: var(--font-display); color: rgb(var(--color-ink)); opacity: 0.78; font-size: 14px; margin: 0; }
```

- [ ] **Step 7.4: Test and commit**

```bash
npm run dev
# Visual check: empty placeholder cards render in 4-up grid
git add sections/product-row.liquid snippets/product-card.liquid assets/section-product-row.css
git commit -m "feat(home): add reusable product row section + product card snippet"
```

---

## Task 8: Custom Banner section

**Files:**
- Create: `sections/custom-banner.liquid`
- Create: `assets/section-custom-banner.css`

- [ ] **Step 8.1: Create `sections/custom-banner.liquid`**

```liquid
{{ 'section-custom-banner.css' | asset_url | stylesheet_tag }}

<section class="custom-banner section--navy">
  <div class="container custom-banner__inner">
    {%- if section.settings.badge != blank -%}
      <span class="custom-banner__badge">{{ section.settings.badge }}</span>
    {%- endif -%}
    <h2 class="custom-banner__heading">{{ section.settings.heading }}</h2>
    {%- if section.settings.lede != blank -%}
      <p class="custom-banner__lede">{{ section.settings.lede }}</p>
    {%- endif -%}
    <a class="btn custom-banner__cta" href="{{ section.settings.cta_url }}">{{ section.settings.cta_label }}</a>
  </div>
</section>

{% schema %}
{
  "name": "Custom Banner",
  "settings": [
    { "type": "text",     "id": "badge",     "label": "Pill badge", "default": "Custom Orders" },
    { "type": "text",     "id": "heading",   "label": "Heading",    "default": "Got something unique in mind?" },
    { "type": "text",     "id": "lede",      "label": "Lede",       "default": "Send us your idea — we'll quote it within 48 hours." },
    { "type": "text",     "id": "cta_label", "label": "CTA label",  "default": "Request a Custom Piece" },
    { "type": "url",      "id": "cta_url",   "label": "CTA URL",    "default": "/pages/custom-orders" }
  ],
  "presets": [ { "name": "Custom Banner" } ]
}
{% endschema %}
```

- [ ] **Step 8.2: Create `assets/section-custom-banner.css`**

```css
.custom-banner { padding: var(--space-section) 0; }
.custom-banner__inner { text-align: center; max-width: 720px; }
.custom-banner__badge {
  display: inline-block;
  background: rgb(var(--color-blush));
  color: rgb(var(--color-navy));
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  margin-bottom: 16px;
}
.custom-banner__heading { font-size: var(--fs-h1); color: rgb(var(--color-bg)); margin: 0 0 12px; }
.custom-banner__lede { color: rgb(var(--color-bg) / 0.85); margin: 0 0 24px; }
.custom-banner__cta { background: rgb(var(--color-blush)); color: rgb(var(--color-navy)); }
.custom-banner__cta:hover { background: rgb(var(--color-blush-deep)); }
```

- [ ] **Step 8.3: Test and commit**

```bash
npm run dev
git add sections/custom-banner.liquid assets/section-custom-banner.css
git commit -m "feat(home): add Custom Orders banner section"
```

---

## Task 9: Markets metaobject + Markets List section

**Files:**
- Manual setup: define `market_event` metaobject in Shopify admin
- Create: `sections/markets-list.liquid`
- Create: `assets/section-markets-list.css`

- [ ] **Step 9.1: In Shopify admin, create the `market_event` metaobject**

Shopify admin → Settings → Custom data → Metaobjects → Add definition.

Name: `Market Event`
Type: `market_event` (system name)
Fields (in order):
- `name` (Single-line text, required)
- `start_date` (Date, required)
- `end_date` (Date, optional)
- `start_time` (Single-line text, e.g. "11:00 AM")
- `end_time` (Single-line text)
- `venue_name` (Single-line text)
- `address` (Multi-line text)
- `google_maps_url` (URL)
- `notes` (Rich text)

Enable "Storefronts" access for this definition so theme can read it.

Add 1–3 sample entries so the homepage section has data to render.

- [ ] **Step 9.2: Create `sections/markets-list.liquid`**

```liquid
{{ 'section-markets-list.css' | asset_url | stylesheet_tag }}

{%- assign all_markets = shop.metaobjects.market_event.values | sort: 'start_date' -%}
{%- assign limit = section.settings.limit | default: 3 -%}
{%- assign today = 'now' | date: '%Y-%m-%d' -%}

<section class="markets-list section">
  <div class="container">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <div class="markets-list__head">
      <h2 class="markets-list__heading">{{ section.settings.heading }}</h2>
      {%- if section.settings.show_link_to_all -%}
        <a class="markets-list__link" href="{{ section.settings.all_url }}">{{ section.settings.all_label }} →</a>
      {%- endif -%}
    </div>

    <ul class="markets-list__list">
      {%- assign printed = 0 -%}
      {%- for m in all_markets -%}
        {%- assign date_iso = m.start_date | date: '%Y-%m-%d' -%}
        {%- if date_iso >= today and printed < limit -%}
          <li class="market-row">
            <div class="market-row__date">
              <span class="market-row__month">{{ m.start_date | date: '%b' }}</span>
              <span class="market-row__day">{{ m.start_date | date: '%-d' }}</span>
            </div>
            <div class="market-row__details">
              <p class="market-row__name">{{ m.name }}</p>
              <p class="market-row__where">{{ m.venue_name }}</p>
            </div>
            <div class="market-row__time">{{ m.start_time }} – {{ m.end_time }}</div>
          </li>
          {%- assign printed = printed | plus: 1 -%}
        {%- endif -%}
      {%- endfor -%}
      {%- if printed == 0 -%}
        <li class="market-row market-row--empty">No upcoming markets at the moment — check back soon.</li>
      {%- endif -%}
    </ul>
  </div>
</section>

{% schema %}
{
  "name": "Upcoming Markets",
  "settings": [
    { "type": "text",     "id": "eyebrow",          "label": "Eyebrow",          "default": "find us in person" },
    { "type": "text",     "id": "heading",          "label": "Heading",          "default": "Upcoming markets" },
    { "type": "range",    "id": "limit",            "label": "Max markets",      "min": 1, "max": 10, "step": 1, "default": 3 },
    { "type": "checkbox", "id": "show_link_to_all", "label": "Show all-markets link", "default": true },
    { "type": "text",     "id": "all_label",        "label": "All link label",   "default": "See all markets" },
    { "type": "url",      "id": "all_url",          "label": "All link URL",     "default": "/pages/markets" }
  ],
  "presets": [ { "name": "Upcoming Markets" } ]
}
{% endschema %}
```

- [ ] **Step 9.3: Create `assets/section-markets-list.css`**

```css
.markets-list__head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
.markets-list__heading { font-size: var(--fs-h2); margin: 0; }
.markets-list__link {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--color-navy));
  text-decoration: none;
}
.markets-list__list { list-style: none; padding: 0; margin: 0; background: rgb(var(--color-surface)); border-radius: var(--radius-md); }
.market-row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid rgb(var(--color-line));
}
.market-row:last-child { border-bottom: 0; }
.market-row__date {
  font-family: var(--font-display);
  text-align: center;
  color: rgb(var(--color-blush-deep));
}
.market-row__month { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.85; }
.market-row__day { display: block; font-size: 28px; font-weight: 700; line-height: 1; }
.market-row__name { font-family: var(--font-display); font-size: 17px; color: rgb(var(--color-navy)); margin: 0; font-weight: 600; }
.market-row__where { font-size: 13px; color: rgb(var(--color-ink) / 0.7); margin: 2px 0 0; }
.market-row__time { font-size: 13px; color: rgb(var(--color-ink) / 0.7); }
.market-row--empty { display: block; text-align: center; padding: 32px; color: rgb(var(--color-ink) / 0.6); font-style: italic; }
@media (max-width: 600px) {
  .market-row { grid-template-columns: 56px 1fr; }
  .market-row__time { grid-column: 2; font-size: 12px; }
}
```

- [ ] **Step 9.4: Test in dev**

```bash
npm run dev
```
Verify: at least one market entry renders, date splits into MONTH/DAY, layout is two-column with date on left.

- [ ] **Step 9.5: Commit**

```bash
git add sections/markets-list.liquid assets/section-markets-list.css
git commit -m "feat(home): add upcoming markets list section with metaobject source"
```

---

## Task 10: Featured Reviews section + metaobject

**Files:**
- Manual setup: `featured_review` metaobject in admin
- Create: `sections/featured-reviews.liquid`
- Create: `assets/section-featured-reviews.css`

- [ ] **Step 10.1: Create `featured_review` metaobject in admin**

Settings → Custom data → Metaobjects → Add definition.

Name: `Featured Review`
Type: `featured_review`
Fields:
- `stars` (Integer, min 1, max 5)
- `quote` (Multi-line text, required)
- `name` (Single-line text, e.g. "Sarah K.")
- `product` (Product reference, optional)

Enable storefront access. Add 2-3 sample entries.

- [ ] **Step 10.2: Create `sections/featured-reviews.liquid`**

```liquid
{{ 'section-featured-reviews.css' | asset_url | stylesheet_tag }}

{%- assign reviews = shop.metaobjects.featured_review.values -%}

<section class="featured-reviews section section--surface">
  <div class="container">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <h2 class="featured-reviews__heading">{{ section.settings.heading }}</h2>
    {%- if section.settings.lede != blank -%}
      <p class="featured-reviews__lede">{{ section.settings.lede }}</p>
    {%- endif -%}

    <div class="featured-reviews__grid">
      {%- for r in reviews limit: section.settings.limit -%}
        <article class="review-card">
          <div class="review-card__stars">
            {%- for i in (1..r.stars) -%}★{%- endfor -%}
          </div>
          <p class="review-card__quote">{{ r.quote }}</p>
          <p class="review-card__name">— {{ r.name }}</p>
        </article>
      {%- else -%}
        <p style="grid-column: 1 / -1; text-align: center; opacity: 0.6;">No featured reviews yet.</p>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Featured Reviews",
  "settings": [
    { "type": "text",  "id": "eyebrow", "label": "Eyebrow", "default": "what customers say" },
    { "type": "text",  "id": "heading", "label": "Heading", "default": "700+ happy customers" },
    { "type": "text",  "id": "lede",    "label": "Lede",    "default": "And growing every market season." },
    { "type": "range", "id": "limit",   "label": "Max",     "min": 1, "max": 4, "step": 1, "default": 2 }
  ],
  "presets": [ { "name": "Featured Reviews" } ]
}
{% endschema %}
```

- [ ] **Step 10.3: Create `assets/section-featured-reviews.css`**

```css
.featured-reviews__heading { font-size: var(--fs-h2); margin: 0 0 8px; }
.featured-reviews__lede { color: rgb(var(--color-ink) / 0.7); margin-bottom: 28px; }
.featured-reviews__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.review-card {
  background: rgb(var(--color-bg));
  border: 1px solid rgb(var(--color-line));
  border-radius: var(--radius-md);
  padding: 24px;
}
.review-card__stars { color: rgb(var(--color-birch)); font-size: 18px; margin-bottom: 8px; letter-spacing: 2px; }
.review-card__quote { font-family: var(--font-display); font-size: 16px; line-height: 1.5; color: rgb(var(--color-ink)); margin: 0 0 12px; }
.review-card__name { font-family: var(--font-body); font-weight: 700; color: rgb(var(--color-navy)); font-size: 13px; margin: 0; }
```

- [ ] **Step 10.4: Test and commit**

```bash
npm run dev
git add sections/featured-reviews.liquid assets/section-featured-reviews.css
git commit -m "feat(home): add featured reviews section sourced from metaobject"
```

---

## Task 11: Instagram Strip section

**Files:**
- Create: `sections/instagram-strip.liquid`
- Create: `assets/section-instagram-strip.css`

For v1 the strip is **manually curated image blocks** (no Instagram API). Owner uploads 6 images via theme editor.

- [ ] **Step 11.1: Create `sections/instagram-strip.liquid`**

```liquid
{{ 'section-instagram-strip.css' | asset_url | stylesheet_tag }}

<section class="instagram-strip section section--surface">
  <div class="container">
    <p class="eyebrow">{{ section.settings.handle }}</p>
    <h2 class="instagram-strip__heading">{{ section.settings.heading }}</h2>
    <div class="instagram-strip__grid">
      {%- for block in section.blocks -%}
        <a class="ig-tile" href="{{ block.settings.link | default: section.settings.profile_url }}" target="_blank" rel="noopener" {{ block.shopify_attributes }}>
          {%- if block.settings.image -%}
            {{ block.settings.image | image_url: width: 300 | image_tag: widths: '150, 300', loading: 'lazy', class: 'ig-tile__img' }}
          {%- else -%}
            <div class="ig-tile__placeholder"></div>
          {%- endif -%}
        </a>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Instagram Strip",
  "settings": [
    { "type": "text", "id": "handle",      "label": "Handle (eyebrow)",   "default": "@clarkebydesign3d" },
    { "type": "text", "id": "heading",     "label": "Heading",            "default": "Follow along on Instagram" },
    { "type": "url",  "id": "profile_url", "label": "Profile URL fallback","default": "https://instagram.com/clarkebydesign3d" }
  ],
  "blocks": [
    {
      "type": "tile",
      "name": "Post image",
      "limit": 12,
      "settings": [
        { "type": "image_picker", "id": "image", "label": "Image" },
        { "type": "url",          "id": "link",  "label": "Post URL (optional)" }
      ]
    }
  ],
  "max_blocks": 12,
  "presets": [ { "name": "Instagram Strip" } ]
}
{% endschema %}
```

- [ ] **Step 11.2: Create `assets/section-instagram-strip.css`**

```css
.instagram-strip__heading { font-size: var(--fs-h2); margin: 0 0 24px; }
.instagram-strip__grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.ig-tile { display: block; aspect-ratio: 1; overflow: hidden; border-radius: var(--radius-sm); background: rgb(var(--color-blush) / 0.4); }
.ig-tile__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ig-tile__placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, rgb(var(--color-blush)), rgb(var(--color-birch))); }
@media (max-width: 880px) { .instagram-strip__grid { grid-template-columns: repeat(3, 1fr); } }
```

- [ ] **Step 11.3: Test and commit**

```bash
npm run dev
git add sections/instagram-strip.liquid assets/section-instagram-strip.css
git commit -m "feat(home): add Instagram strip section (manual image blocks for v1)"
```

---

## Task 12: Newsletter section

**Files:**
- Create: `sections/newsletter.liquid`
- Create: `assets/section-newsletter.css`

- [ ] **Step 12.1: Create `sections/newsletter.liquid`**

```liquid
{{ 'section-newsletter.css' | asset_url | stylesheet_tag }}

<section class="newsletter section">
  <div class="container newsletter__inner">
    <p class="eyebrow">{{ section.settings.eyebrow }}</p>
    <h2 class="newsletter__heading">{{ section.settings.heading }}</h2>
    {%- if section.settings.lede != blank -%}<p class="newsletter__lede">{{ section.settings.lede }}</p>{%- endif -%}

    {% form 'customer', class: 'newsletter__form' %}
      <input type="hidden" name="contact[tags]" value="newsletter">
      <label for="NewsletterEmail" class="visually-hidden">Email</label>
      <input id="NewsletterEmail" type="email" name="contact[email]" placeholder="{{ section.settings.placeholder }}" required class="newsletter__input">
      <button type="submit" class="btn btn-primary newsletter__submit">{{ section.settings.button_label }}</button>
      {%- if form.posted_successfully? -%}
        <p class="newsletter__msg newsletter__msg--ok">{{ section.settings.success_message }}</p>
      {%- endif -%}
      {%- if form.errors -%}
        <p class="newsletter__msg newsletter__msg--err">{{ form.errors | default_errors }}</p>
      {%- endif -%}
    {% endform %}
  </div>
</section>

{% schema %}
{
  "name": "Newsletter",
  "settings": [
    { "type": "text", "id": "eyebrow",         "label": "Eyebrow",     "default": "join the list" },
    { "type": "text", "id": "heading",         "label": "Heading",     "default": "Be the first to know" },
    { "type": "text", "id": "lede",            "label": "Lede",        "default": "New drops, seasonal restocks, and behind-the-studio sneak peeks." },
    { "type": "text", "id": "placeholder",     "label": "Placeholder", "default": "you@email.com" },
    { "type": "text", "id": "button_label",    "label": "Button label","default": "Subscribe" },
    { "type": "text", "id": "success_message", "label": "Success message", "default": "Thanks for subscribing — keep an eye on your inbox." }
  ],
  "presets": [ { "name": "Newsletter" } ]
}
{% endschema %}
```

- [ ] **Step 12.2: Create `assets/section-newsletter.css`**

```css
.newsletter__inner { text-align: center; max-width: 540px; }
.newsletter__heading { font-size: var(--fs-h2); margin: 0 0 8px; }
.newsletter__lede { color: rgb(var(--color-ink) / 0.7); margin: 0 0 24px; }
.newsletter__form { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.newsletter__input {
  flex: 1 1 240px;
  padding: 14px 18px;
  border: 1.5px solid rgb(var(--color-line));
  border-radius: var(--radius-pill);
  background: rgb(var(--color-surface));
  font-family: var(--font-body);
  font-size: 15px;
  color: rgb(var(--color-navy));
}
.newsletter__input:focus { outline: 2px solid rgb(var(--color-navy)); outline-offset: 2px; }
.newsletter__submit { flex: 0 0 auto; }
.newsletter__msg { width: 100%; margin: 12px 0 0; font-size: 14px; }
.newsletter__msg--ok  { color: rgb(var(--color-navy)); }
.newsletter__msg--err { color: #b5392e; }
.visually-hidden { position: absolute; left: -9999px; }
```

- [ ] **Step 12.3: Test and commit**

```bash
npm run dev
git add sections/newsletter.liquid assets/section-newsletter.css
git commit -m "feat(home): add newsletter section using Shopify customer form"
```

---

## Task 13: Footer section

**Files:**
- Modify: `sections/footer.liquid` (replace Dawn's)
- Create: `assets/footer.css`

- [ ] **Step 13.1: Replace `sections/footer.liquid`**

```liquid
{{ 'footer.css' | asset_url | stylesheet_tag }}

<footer class="site-footer" role="contentinfo">
  <div class="container site-footer__inner">
    <div class="site-footer__col">
      <p class="site-footer__brand">CLARKE <span>BY DESIGN</span></p>
      <p class="site-footer__tagline">{{ section.settings.tagline }}</p>
    </div>

    {%- for block in section.blocks -%}
      {%- case block.type -%}
        {%- when 'link_list' -%}
          <div class="site-footer__col" {{ block.shopify_attributes }}>
            <h4 class="site-footer__heading">{{ block.settings.heading }}</h4>
            <ul class="site-footer__links">
              {%- for link in linklists[block.settings.menu].links -%}
                <li><a href="{{ link.url }}">{{ link.title }}</a></li>
              {%- endfor -%}
            </ul>
          </div>
        {%- when 'social' -%}
          <div class="site-footer__col" {{ block.shopify_attributes }}>
            <h4 class="site-footer__heading">{{ block.settings.heading }}</h4>
            <div class="site-footer__social">
              {%- if block.settings.instagram_url != blank -%}
                <a href="{{ block.settings.instagram_url }}" aria-label="Instagram" target="_blank" rel="noopener">{% render 'icon', name: 'instagram', size: 22 %}</a>
              {%- endif -%}
            </div>
          </div>
      {%- endcase -%}
    {%- endfor -%}
  </div>
  <div class="container site-footer__base">
    <p>© {{ 'now' | date: '%Y' }} {{ shop.name }} — {{ section.settings.tagline }}</p>
  </div>
</footer>

{% schema %}
{
  "name": "Footer",
  "settings": [
    { "type": "text", "id": "tagline", "label": "Tagline", "default": "Handmade in Ontario · Made by Marielle" }
  ],
  "blocks": [
    {
      "type": "link_list",
      "name": "Link list",
      "settings": [
        { "type": "text",       "id": "heading", "label": "Heading" },
        { "type": "link_list",  "id": "menu",    "label": "Menu" }
      ]
    },
    {
      "type": "social",
      "name": "Social",
      "limit": 1,
      "settings": [
        { "type": "text", "id": "heading",       "label": "Heading",       "default": "Follow" },
        { "type": "url",  "id": "instagram_url", "label": "Instagram URL", "default": "https://instagram.com/clarkebydesign3d" }
      ]
    }
  ],
  "default": {
    "blocks": [
      { "type": "link_list" },
      { "type": "social" }
    ]
  }
}
{% endschema %}
```

- [ ] **Step 13.2: Create `assets/footer.css`**

```css
.site-footer { background: rgb(var(--color-ink)); color: rgb(var(--color-bg) / 0.78); padding: 56px 0 20px; margin-top: var(--space-section); }
.site-footer__inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgb(var(--color-bg) / 0.15);
}
.site-footer__brand { font-family: var(--font-body); font-weight: 800; color: rgb(var(--color-bg)); font-size: 18px; letter-spacing: 0.04em; margin: 0 0 8px; }
.site-footer__brand span { font-family: var(--font-display); font-weight: 400; font-size: 10px; letter-spacing: 0.3em; margin-left: 6px; }
.site-footer__tagline { font-size: 13px; opacity: 0.7; margin: 0; }
.site-footer__heading { font-family: var(--font-body); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgb(var(--color-bg)); margin: 0 0 16px; opacity: 0.85; }
.site-footer__links { list-style: none; padding: 0; margin: 0; }
.site-footer__links a { color: rgb(var(--color-bg) / 0.78); text-decoration: none; font-size: 13px; line-height: 2; }
.site-footer__links a:hover { color: rgb(var(--color-blush)); }
.site-footer__social a { color: rgb(var(--color-bg)); }
.site-footer__base { padding-top: 20px; font-size: 12px; opacity: 0.6; text-align: center; }
@media (max-width: 720px) { .site-footer__inner { grid-template-columns: 1fr; gap: 32px; } }
```

- [ ] **Step 13.3: Test and commit**

```bash
npm run dev
git add sections/footer.liquid assets/footer.css
git commit -m "feat(footer): rebuild footer to match brand"
```

---

## Task 14: Theme global JS (mobile menu, sticky header)

**Files:**
- Modify: `assets/theme.js` (or wherever Dawn keeps its theme JS — replace top of file)

- [ ] **Step 14.1: Create `assets/theme.js`** (overwrite Dawn's existing file)

```javascript
// Clarke By Design — theme.js
// Tiny vanilla JS for global UI behavior.

(function () {
  // Mobile menu toggle
  const menuBtn = document.querySelector('[data-mobile-menu-toggle]');
  const nav = document.querySelector('.site-header__nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('site-header__nav--open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  // Update cart count when Shopify cart changes (works with section AJAX)
  document.addEventListener('cart:updated', (e) => {
    const count = e?.detail?.cart?.item_count ?? 0;
    document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = count; });
  });
})();
```

- [ ] **Step 14.2: Ensure `theme.js` is loaded** by checking `layout/theme.liquid` for `{{ 'theme.js' | asset_url | script_tag }}` near the bottom. If absent, add immediately before `</body>`.

- [ ] **Step 14.3: Test and commit**

```bash
npm run dev
# Resize to mobile, tap menu button — nav should toggle a `--open` class (will need a CSS rule too for visibility)
git add assets/theme.js layout/theme.liquid
git commit -m "feat(global): minimal vanilla JS for mobile menu and cart count"
```

Add this rule to `assets/header.css` to actually show the mobile menu when open:

```css
@media (max-width: 880px) {
  .site-header__nav--open {
    display: block;
    position: absolute;
    top: 72px; left: 0; right: 0;
    background: rgb(var(--color-bg));
    border-bottom: 1px solid rgb(var(--color-line));
    padding: 16px 24px;
  }
  .site-header__nav--open .site-header__nav-list { flex-direction: column; gap: 12px; }
}
```

```bash
git add assets/header.css
git commit --amend --no-edit
```

---

## Task 15: Locales scaffolding

**Files:**
- Modify: `locales/en.default.json`
- Create: `locales/fr.json`

- [ ] **Step 15.1: Audit `locales/en.default.json`** — Dawn ships a comprehensive English file. Keep it as the canonical source.

- [ ] **Step 15.2: Create `locales/fr.json` as an empty-value mirror**

```bash
node -e "const en = require('./locales/en.default.json'); const empty = (o) => Object.fromEntries(Object.entries(o).map(([k,v]) => [k, typeof v === 'object' ? empty(v) : '']));require('fs').writeFileSync('./locales/fr.json', JSON.stringify(empty(en), null, 2));"
```
Expected: `locales/fr.json` exists with the same structure as English but blank values.

- [ ] **Step 15.3: Commit**

```bash
git add locales/
git commit -m "i18n: add French locale placeholder mirroring English structure"
```

---

## Task 16: Final smoke test + push to dev store

**Files:** none

- [ ] **Step 16.1: Run theme check**

```bash
npm run check
```
Expected: no errors. If warnings appear, decide per-warning whether to fix or accept.

- [ ] **Step 16.2: Push unpublished to dev store**

```bash
npm run push
```
Expected: theme uploads, CLI prints preview URL.

- [ ] **Step 16.3: Open preview URL** and visually verify each section in order:
  - Header sticks, mega-menu opens on Shop hover
  - Hero tiles render in 4-up grid
  - Occasion tiles render in 4-up grid
  - Bestsellers section renders product cards (with the `bestsellers` collection populated)
  - Custom orders banner is full-width navy
  - Reviews show at least 1 sample review
  - Markets show upcoming entries
  - Instagram strip renders 6 tiles
  - Newsletter form submits successfully (check Customers in admin)
  - Footer renders three columns

- [ ] **Step 16.4: Tag the release**

```bash
git tag v0.1.0-foundation -m "Foundation + Homepage complete"
git push origin main --tags
```

---

## Self-Review Results

**Spec coverage:**
- §3.1 Primary nav → Task 4 (header + mega-menu) ✓
- §3.2 Utility nav → Task 4 ✓
- §3.3 Footer → Task 13 ✓
- §4.1 Hero tiles → Task 5 ✓
- §4.2 Shop by Occasion → Task 6 ✓
- §4.3 Bestsellers → Task 7 ✓
- §4.4 Custom banner → Task 8 ✓
- §4.5 Reviews → Task 10 ✓
- §4.6 Upcoming markets → Task 9 ✓
- §4.7 Instagram strip → Task 11 ✓
- §4.8 Newsletter → Task 12 ✓
- §2.2 palette tokens → Task 3 ✓
- §2.3 typography → Task 3 ✓
- §7.3 Markets metaobject → Task 9.1 ✓
- §7.3 Featured review metaobject → Task 10.1 ✓
- §7.1 Locales structure → Task 15 ✓

**Not covered (intentionally — belongs to later plans):**
- Product page (Plan 2)
- Markets full-page list, About, Custom Orders pages (Plan 3)
- Local pickup config, perf/a11y pass (Plan 4)

**Placeholder scan:** none — every code step has actual code.

**Type consistency:** `data-cart-count` attribute used in header (Task 4.3) and theme.js (Task 14.1). Metaobject types `market_event` and `featured_review` used consistently between admin setup (Tasks 9.1, 10.1) and Liquid (Tasks 9.2, 10.2). Class naming consistent (`site-header__*`, `hero-tile__*`, etc.).

Plan complete.
