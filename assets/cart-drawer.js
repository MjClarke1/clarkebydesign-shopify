// Clarke By Design — cart-drawer.js
// Opens drawer on Add to Cart submit; updates contents via Shopify cart AJAX
// and the section rendering API (?section_id=cart-drawer).

(function () {
  const drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;

  const panel = drawer.querySelector('.cart-drawer__panel');
  const bodyEl = drawer.querySelector('[data-cart-drawer-body]');
  const footerEl = drawer.querySelector('[data-cart-drawer-footer]');
  const closeEls = drawer.querySelectorAll('[data-cart-drawer-close]');
  const closeBtn = drawer.querySelector('.cart-drawer__close');

  // ---- Focus trap state ----------------------------------------------
  let lastFocused = null;
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const getFocusable = () =>
    Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('hidden') && el.offsetParent !== null
    );

  const trapFocus = (e) => {
    if (e.key !== 'Tab' || drawer.hidden) return;
    const items = getFocusable();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // ---- Open / close --------------------------------------------------
  const openDrawer = () => {
    lastFocused = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('cart-drawer-open');
    document.body.classList.add('cart-drawer-open');
    // Move focus inside drawer for keyboard users
    setTimeout(() => {
      if (closeBtn) closeBtn.focus();
    }, 50);
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('cart-drawer-open');
    document.body.classList.remove('cart-drawer-open');
    setTimeout(() => {
      drawer.hidden = true;
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }, 250);
  };

  closeEls.forEach((el) => el.addEventListener('click', closeDrawer));

  document.addEventListener('keydown', (e) => {
    if (drawer.hidden) return;
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }
    trapFocus(e);
  });

  // ---- Section rendering refresh -------------------------------------
  async function refresh() {
    try {
      const res = await fetch('/?section_id=cart-drawer', {
        headers: { Accept: 'text/html' },
      });
      if (res.ok) {
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newBody = doc.querySelector('[data-cart-drawer-body]');
        const newFooter = doc.querySelector('[data-cart-drawer-footer]');
        if (newBody && bodyEl) bodyEl.innerHTML = newBody.innerHTML;
        if (newFooter && footerEl) footerEl.innerHTML = newFooter.innerHTML;
      }
    } catch (err) {
      console.warn('[Clarke] cart-drawer section refresh failed', err);
    }

    // Update header cart count badge
    try {
      const cartRes = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      if (cartRes.ok) {
        const cart = await cartRes.json();
        document.querySelectorAll('[data-cart-count]').forEach((el) => {
          el.textContent = cart.item_count;
        });
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
      }
    } catch (err) {
      console.warn('[Clarke] cart-count update failed', err);
    }
  }

  // Public hook for other scripts (e.g. cart-icon click handlers)
  window.ClarkeCart = { open: openDrawer, close: closeDrawer, refresh };

  // ---- Intercept product-form submits --------------------------------
  document.addEventListener(
    'submit',
    async (e) => {
      const form = e.target.closest('[data-product-form]');
      if (!form) return;
      e.preventDefault();
      const btn = form.querySelector('[data-add-to-cart]');
      const originalDisabled = btn ? btn.disabled : false;
      if (btn) btn.disabled = true;
      try {
        const fd = new FormData(form);
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          body: fd,
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!res.ok) {
          let msg = 'Could not add to cart. Please try again.';
          try {
            const err = await res.json();
            if (err && err.description) msg = err.description;
          } catch (_) {
            /* noop */
          }
          alert(msg);
          return;
        }
        await refresh();
        openDrawer();
      } finally {
        if (btn) btn.disabled = originalDisabled;
      }
    },
    true
  );

  // ---- Header cart icon opens drawer instead of navigating -----------
  document.querySelectorAll('.site-header__cart').forEach((a) => {
    a.addEventListener('click', (e) => {
      // Allow modifier-click / middle-click to navigate normally
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      openDrawer();
    });
  });

  // ---- Quantity changes inside the drawer ----------------------------
  drawer.addEventListener('click', async (e) => {
    const dec = e.target.closest('[data-cart-qty-decrement]');
    const inc = e.target.closest('[data-cart-qty-increment]');
    if (!dec && !inc) return;
    const wrap = e.target.closest('.cart-line__qty');
    if (!wrap) return;
    const input = wrap.querySelector('[data-cart-qty-input]');
    if (!input) return;
    let val = parseInt(input.value, 10) || 0;
    val = dec ? Math.max(0, val - 1) : val + 1;
    input.value = val;
    await updateLine(input.dataset.lineKey, val);
  });

  drawer.addEventListener('change', async (e) => {
    const input = e.target.closest('[data-cart-qty-input]');
    if (!input) return;
    const val = Math.max(0, parseInt(input.value, 10) || 0);
    await updateLine(input.dataset.lineKey, val);
  });

  async function updateLine(key, quantity) {
    try {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity }),
      });
      await refresh();
    } catch (err) {
      console.warn('[Clarke] cart line update failed', err);
    }
  }
})();
