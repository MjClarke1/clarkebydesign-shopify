/*
 * Clarke By Design — product-personalize.js
 *
 * Wires the personalization chip pickers on the product page to:
 *   1. Shopify variant matching   — find the variant whose
 *      [option1, option2, option3] matches the current radio selections.
 *   2. Hidden `name="id"` input   — updates so the form posts the right variant.
 *   3. Price + CTA price          — updates both the displayed price and the
 *      "Add to cart — $price" inline span.
 *   4. CTA enabled/disabled state — disables when no variant matches, when the
 *      variant is sold out, or when the personalised Name input is empty.
 *   5. Gallery thumb active state — paints the navy ring on the selected thumb.
 *   6. Name input character counter — `N / max` readout.
 *   7. URL `?variant=` parameter   — kept in sync via history.replaceState
 *      so links are shareable.
 *
 * Vanilla ES — no imports, no framework. Loaded with `defer` from theme.liquid
 * only on product templates.
 */

(function () {
  'use strict';

  const root = document.querySelector('[data-product-main]');
  if (!root) return;

  const form = root.querySelector('[data-product-form]');
  const variantInput = root.querySelector('[data-variant-id-input]');
  const priceEl = root.querySelector('[data-price-current]');
  const ctaPriceEl = root.querySelector('[data-cta-price]');
  const ctaBtn = root.querySelector('[data-add-to-cart]');
  const ctaLabel = ctaBtn ? ctaBtn.querySelector('[data-cta-label]') : null;
  const variantsScript = root.querySelector('[data-variants-json]');

  if (!form || !variantInput || !ctaBtn || !variantsScript) return;

  // Cache the original CTA label HTML so we can restore the
  // "Add to cart — $price" template after a Sold out / Unavailable state.
  const originalCtaLabelHTML = ctaLabel ? ctaLabel.innerHTML : '';

  // ---- Parse variant catalogue ---------------------------------------------
  let variants = [];
  try {
    variants = JSON.parse(variantsScript.textContent);
    if (!Array.isArray(variants)) variants = [];
  } catch (err) {
    // If we can't parse the variants we let the server-rendered form handle
    // submission as-is. The CTA still works; we just can't live-update.
    console.warn('[Clarke] failed to parse variants JSON', err);
    return;
  }

  // ---- Money formatting ----------------------------------------------------
  // We rely on Shopify's currency code when available; fall back to CAD which
  // is the store's default. Shopify stores prices in cents.
  const currencyCode = (
    (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) ||
    'CAD'
  );
  let moneyFormatter;
  try {
    moneyFormatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    });
  } catch (_) {
    moneyFormatter = null;
  }
  const formatMoney = (cents) => {
    const dollars = Number(cents) / 100;
    if (moneyFormatter) return moneyFormatter.format(dollars);
    return '$' + dollars.toFixed(2);
  };

  // ---- Read selected chip values ------------------------------------------
  // Each chip radio carries `data-chip-option="1|2|3"`. We sort by position so
  // the array matches Shopify's variant.option1/2/3 layout.
  const getSelectedOptions = () => {
    return Array.from(root.querySelectorAll('input[data-chip-option]:checked'))
      .sort((a, b) => Number(a.dataset.chipOption) - Number(b.dataset.chipOption))
      .map((input) => input.value);
  };

  // ---- Variant matching ----------------------------------------------------
  // Walk the variants and return the one whose non-null option values exactly
  // match the current radio selection. Returns null if no match (Shopify can
  // have sparse variant grids — not every combo is a real SKU).
  const findMatchingVariant = () => {
    const selected = getSelectedOptions();
    if (selected.length === 0) return variants[0] || null;
    return (
      variants.find((v) => {
        const opts = [v.option1, v.option2, v.option3].filter(
          (o) => o !== null && o !== undefined
        );
        if (opts.length !== selected.length) return false;
        return opts.every((opt, idx) => opt === selected[idx]);
      }) || null
    );
  };

  // ---- Name input ----------------------------------------------------------
  const nameInput = root.querySelector('[data-property-name]');
  const nameCounter = root.querySelector('[data-name-counter]');

  const nameValid = () => {
    if (!nameInput) return true; // products without a Name picker are always valid
    return nameInput.value.trim().length > 0;
  };

  const updateCounter = () => {
    if (!nameInput || !nameCounter) return;
    const max = nameInput.maxLength > 0 ? nameInput.maxLength : 10;
    nameCounter.textContent = `${nameInput.value.length} / ${max}`;
  };

  // ---- Apply variant state to the DOM --------------------------------------
  const updateForVariant = (variant) => {
    if (!variant) {
      // No SKU matches this chip combo — disable CTA and show Unavailable.
      variantInput.value = '';
      ctaBtn.disabled = true;
      if (ctaLabel) ctaLabel.textContent = 'Unavailable';
      return;
    }

    variantInput.value = variant.id;

    // Price text — both the standalone price block and the inline CTA price.
    const priceText = formatMoney(variant.price);
    if (priceEl) priceEl.textContent = priceText;

    // The CTA label can be in either of two states:
    //   1) Available  — innerHTML is "Add to cart — <span data-cta-price>$X</span>"
    //   2) Sold out / Unavailable — innerHTML was overwritten with plain text
    // When transitioning from (2) back to (1) we must restore the template,
    // which is why we cached originalCtaLabelHTML on init.
    if (variant.available && nameValid()) {
      if (ctaLabel && !ctaLabel.querySelector('[data-cta-price]')) {
        ctaLabel.innerHTML = originalCtaLabelHTML;
      }
      const innerPriceEl = ctaBtn.querySelector('[data-cta-price]');
      if (innerPriceEl) innerPriceEl.textContent = priceText;
      ctaBtn.disabled = false;
    } else if (!variant.available) {
      if (ctaLabel) ctaLabel.textContent = 'Sold out';
      ctaBtn.disabled = true;
    } else {
      // Available but Name is empty — keep label as add-to-cart but disable.
      if (ctaLabel && !ctaLabel.querySelector('[data-cta-price]')) {
        ctaLabel.innerHTML = originalCtaLabelHTML;
      }
      const innerPriceEl = ctaBtn.querySelector('[data-cta-price]');
      if (innerPriceEl) innerPriceEl.textContent = priceText;
      ctaBtn.disabled = true;
    }

    // Mirror selection in the URL so links are shareable.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', String(variant.id));
      history.replaceState({}, '', url.toString());
    } catch (_) {
      // Some embedded contexts (e.g. Shopify theme editor preview) block
      // history mutations — silently ignore.
    }
  };

  // ---- Event wiring --------------------------------------------------------
  // One delegated change listener handles every chip radio in the form.
  root.addEventListener('change', (event) => {
    const target = event.target;
    if (!target || !target.matches('input[data-chip-option]')) return;
    updateForVariant(findMatchingVariant());
  });

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      updateCounter();
      // Re-run update so the CTA toggles enabled/disabled when name becomes
      // valid or empty without needing to flip the variant.
      updateForVariant(findMatchingVariant());
    });
    updateCounter();
  }

  // ---- Gallery thumb active-state ------------------------------------------
  // The product-gallery snippet (Task 2) uses radios + sibling CSS to swap the
  // main image. The "selected thumb gets a navy ring" effect needs JS because
  // pure CSS sibling selectors can't reliably target an arbitrary thumb index.
  const gallery = root.querySelector('[data-gallery]');
  if (gallery) {
    const radios = Array.from(gallery.querySelectorAll('.product-gallery__radio'));
    const thumbs = Array.from(gallery.querySelectorAll('.product-gallery__thumb'));
    const paintActive = (activeIdx) => {
      thumbs.forEach((thumb, idx) => {
        thumb.classList.toggle('is-active', idx === activeIdx);
      });
    };
    radios.forEach((radio, idx) => {
      radio.addEventListener('change', () => {
        if (radio.checked) paintActive(idx);
      });
    });
    const initiallyChecked = radios.findIndex((r) => r.checked);
    if (initiallyChecked >= 0) paintActive(initiallyChecked);
  }

  // ---- Initial sync --------------------------------------------------------
  // Apply the current variant on load so the URL / price / CTA reflect any
  // server-side `?variant=` parameter the page was rendered with.
  updateForVariant(findMatchingVariant());
})();
