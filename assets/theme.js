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

  // Header dropdown aria-expanded toggle (keyboard a11y)
  document.querySelectorAll('.site-header__nav-item.has-dropdown').forEach((item) => {
    const btn = item.querySelector('.site-header__nav-link');
    if (!btn) return;
    item.addEventListener('focusin', () => btn.setAttribute('aria-expanded', 'true'));
    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget)) btn.setAttribute('aria-expanded', 'false');
    });
    item.addEventListener('mouseenter', () => btn.setAttribute('aria-expanded', 'true'));
    item.addEventListener('mouseleave', () => btn.setAttribute('aria-expanded', 'false'));
  });

  // Update cart count when Shopify cart changes (works with section AJAX)
  document.addEventListener('cart:updated', (e) => {
    const count = e?.detail?.cart?.item_count ?? 0;
    document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = count; });
  });

  // Scroll-triggered fade-in for homepage sections
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.05 });

    document.querySelectorAll('.section, .hero-tiles, .custom-banner, .markets-list, .featured-reviews, .instagram-strip, .newsletter, .trust-strip').forEach((el) => {
      el.classList.add('reveal-on-scroll');
      observer.observe(el);
    });
  }
})();
