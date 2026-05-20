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
