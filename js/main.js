/* Progressive enhancements. Product content lives in productos.html, not a second array. */
document.addEventListener('DOMContentLoaded', () => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const focusable = element => [...element.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')]
    .filter(node => node.getClientRects().length && !node.closest('[hidden]'));

  function initNavigation() {
    const header = document.getElementById('navbar');
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    const disclosure = document.getElementById('mobileNavigation');
    if (!header || !toggle || !nav || !disclosure) return;
    const mobile = window.matchMedia('(max-width: 960px)');
    const links = [...header.querySelectorAll('nav a[href]')];
    const mobileLinks = [...nav.querySelectorAll('a')];
    const setOpen = (next, restoreFocus = false) => {
      disclosure.open = next && mobile.matches;
      if (restoreFocus) toggle.focus({ preventScroll: true });
    };
    // Native summary handles opening and exposes its expanded state, even without JS.
    links.forEach(link => link.addEventListener('click', () => {
      setOpen(false);
    }));
    header.addEventListener('keydown', event => {
      if (!disclosure.open) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); }
      if (event.key === 'Tab') {
        const items = [toggle, ...mobileLinks];
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
        else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); toggle.focus(); }
      }
    });
    document.addEventListener('click', event => { if (disclosure.open && !disclosure.contains(event.target)) setOpen(false); });
    mobile.addEventListener('change', () => {
      const focusWasInNav = disclosure.contains(document.activeElement);
      const focusWasInDesktopNav = document.getElementById('desktopNav').contains(document.activeElement);
      setOpen(false);
      if (!mobile.matches && focusWasInNav) header.querySelector('.logo').focus({ preventScroll: true });
      if (mobile.matches && focusWasInDesktopNav) toggle.focus({ preventScroll: true });
    });
    window.addEventListener('pageshow', () => setOpen(false));
    let scheduled = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      scheduled = false;
    };
    window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function initProducts() {
    const dialog = document.getElementById('productModal');
    if (!dialog || typeof dialog.showModal !== 'function') return; // Native details remain the fallback.
    const title = document.getElementById('productModalTitle');
    const image = document.getElementById('productModalImage');
    const info = document.getElementById('productModalDetails');
    const status = document.getElementById('productImageStatus');
    const dots = dialog.querySelector('.product-carousel-dots');
    const quote = document.getElementById('productQuoteLink');
    const products = new Map();
    let product, slide = 0, opener = null;

    document.querySelectorAll('.product-bento-tile[data-product-index]').forEach(tile => {
      const card = tile.closest('.product-card');
      const key = tile.dataset.productIndex;
      products.set(key, {
        name: tile.querySelector('.product-tile-name').textContent,
        details: card.querySelector('.product-detail-list'),
        images: [...card.querySelectorAll('.product-image-links a')].map(link => link.getAttribute('href'))
      });
      tile.setAttribute('aria-haspopup', 'dialog');
      tile.setAttribute('aria-controls', 'productModal');
      tile.addEventListener('click', event => {
        const selected = products.get(tile.dataset.productIndex);
        if (!selected || !selected.images.length) return;
        event.preventDefault();
        product = selected;
        opener = tile;
        title.textContent = product.name;
        quote.href = `cotizacion.html?${new URLSearchParams({ producto: product.name })}`;
        info.replaceChildren(product.details.cloneNode(true));
        dots.replaceChildren(...product.images.map((_, index) => {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'product-carousel-dot';
          button.setAttribute('aria-label', `Ver imagen ${index + 1}`);
          button.addEventListener('click', () => setSlide(index));
          return button;
        }));
        setSlide(0);
        dialog.showModal();
        document.body.classList.add('modal-open');
        dialog.scrollTop = 0;
        dialog.querySelector('.product-modal-close').focus({ preventScroll: true });
      });
    });

    function setSlide(index) {
      slide = (index + product.images.length) % product.images.length;
      image.src = product.images[slide];
      image.alt = `${product.name}, imagen ${slide + 1}`;
      status.textContent = `${slide + 1} / ${product.images.length}`;
      [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === slide)));
    }
    dialog.querySelector('.product-carousel-prev').addEventListener('click', () => setSlide(slide - 1));
    dialog.querySelector('.product-carousel-next').addEventListener('click', () => setSlide(slide + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); setSlide(slide + (event.key === 'ArrowLeft' ? -1 : 1));
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault(); setSlide(event.key === 'Home' ? 0 : product.images.length - 1);
      }
      if (event.key === 'Tab') {
        const items = focusable(dialog);
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
        else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
      }
    });
    // Escape is provided by the native dialog cancel event.
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (dialog.returnValue !== 'quote') opener?.focus({ preventScroll: true });
      dialog.returnValue = '';
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    quote.addEventListener('click', () => dialog.close('quote'));
  }

  function initClients() {
    const grid = document.getElementById('clientsGrid');
    const button = document.getElementById('clientsToggle');
    if (!grid || !button) return;
    const extra = [...grid.querySelectorAll('.client-logo')].slice(12);
    if (!extra.length) return;
    const label = button.querySelector('[data-clients-label]');
    const setExpanded = expanded => {
      extra.forEach(logo => { logo.hidden = !expanded; });
      button.setAttribute('aria-expanded', String(expanded));
      label.textContent = expanded ? 'Ver menos clientes' : 'Ver todos nuestros clientes';
    };
    // Without JavaScript, the full client grid remains visible.
    setExpanded(false);
    button.hidden = false;
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      setExpanded(expanded);
      if (!expanded) button.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    });
  }

  function initQuoteContext() {
    const form = document.getElementById('cotizacion')?.querySelector('form');
    if (!form) return;
    const params = new URLSearchParams(location.search);
    const product = (params.get('producto') || '').trim().slice(0, 160);
    const service = params.get('servicio');
    if (service && !form.elements.servicio.value && [...form.elements.servicio.options].some(option => option.value === service)) form.elements.servicio.value = service;
    if (product) {
      const context = document.getElementById('quoteContext');
      context.textContent = `Tu consulta: ${product}`;
      context.hidden = false;
      if (!form.elements.mensaje.value.trim()) form.elements.mensaje.value = `Deseo cotizar: ${product}.`;
    }
  }

  function initLegacyAnchors() {
    if (document.body.dataset.page !== 'inicio') return;
    const routes = { nosotros: 'nosotros.html', 'porque-mb': 'nosotros.html#porque-mb', diferenciales: 'nosotros.html#porque-mb', clientes: 'nosotros.html#clientes', productos: 'productos.html', servicios: 'servicios.html', procesos: 'nosotros.html#procesos', cotizacion: 'cotizacion.html', contacto: 'cotizacion.html' };
    const redirect = () => {
      const key = location.hash.slice(1);
      const target = Object.hasOwn(routes, key) ? routes[key] : null;
      if (target) location.replace(target);
    };
    window.addEventListener('hashchange', redirect);
    redirect();
  }

  function initProcesses() {
    const section = document.getElementById('procesos');
    if (!section) return;
    const list = section.querySelector('.process-tabs');
    const tabs = [...section.querySelectorAll('.process-tab')];
    const panels = [...section.querySelectorAll('.process-panel')];
    if (tabs.length !== panels.length || !tabs.length) return;
    let active = 0;
    let transition;
    function select(index, moveFocus = false) {
      active = index;
      transition?.cancel();
      tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
      panels.forEach((panel, i) => { panel.hidden = i !== index; });
      if (moveFocus) tabs[index].focus();
      if (!motion.matches && panels[index].animate) {
        transition = panels[index].animate([{ opacity: .55, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
      }
    }
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Etapas de producción');
    // Both arrow axes work; orientation tracks the actual responsive layout.
    const compact = window.matchMedia('(min-width: 521px) and (max-width: 960px)');
    const updateOrientation = () => list.setAttribute('aria-orientation', compact.matches ? 'horizontal' : 'vertical');
    compact.addEventListener('change', updateOrientation); updateOrientation();
    tabs.forEach((tab, i) => {
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panels[i].id);
      panels[i].setAttribute('role', 'tabpanel'); panels[i].tabIndex = 0;
      tab.addEventListener('click', event => { event.preventDefault(); select(i); });
      tab.addEventListener('keydown', event => {
        const next = ['ArrowRight', 'ArrowDown'].includes(event.key);
        const prev = ['ArrowLeft', 'ArrowUp'].includes(event.key);
        if (next || prev) { event.preventDefault(); select((active + (next ? 1 : -1) + tabs.length) % tabs.length, true); }
        else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); select(event.key === 'Home' ? 0 : tabs.length - 1, true); }
        else if (event.key === ' ') { event.preventDefault(); select(i); }
      });
    });
    section.classList.add('processes-enhanced');
    const initial = panels.findIndex(panel => `#${panel.id}` === location.hash);
    select(initial >= 0 ? initial : 0);
    window.addEventListener('hashchange', () => {
      const index = panels.findIndex(panel => `#${panel.id}` === location.hash);
      if (index >= 0) select(index);
    });
    motion.addEventListener('change', () => { if (motion.matches) transition?.cancel(); });
  }

  function initHeroVideo() {
    const video = document.getElementById('heroVideo');
    const toggle = document.getElementById('heroVideoToggle');
    if (!video || !toggle || motion.matches) return;
    let finished = false;
    let pausedByUser = false;
    let visible = true;
    const updateToggle = () => {
      toggle.textContent = video.paused ? 'Reanudar video' : 'Pausar video';
    };
    const showStill = () => {
      finished = true;
      video.pause();
      video.hidden = true;
      toggle.hidden = true;
    };
    const play = () => {
      if (finished || pausedByUser || !visible || document.hidden || motion.matches) return;
      if (!video.getAttribute('src')) video.src = video.dataset.src;
      video.muted = true;
      video.play().then(() => {
        if (finished || !visible || document.hidden || motion.matches) { video.pause(); return; }
        video.hidden = false;
        toggle.hidden = false;
        updateToggle();
      }).catch(() => {
        if (!finished && visible && !document.hidden && !pausedByUser) showStill();
      });
    };
    video.addEventListener('ended', showStill);
    video.addEventListener('error', showStill);
    video.addEventListener('pause', updateToggle);
    video.addEventListener('play', updateToggle);
    toggle.addEventListener('click', () => {
      pausedByUser = !video.paused;
      if (pausedByUser) { video.pause(); updateToggle(); }
      else play();
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (!visible) video.pause();
        else play();
      }, { threshold: .05 });
      observer.observe(video.closest('.hero'));
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else play();
    });
    motion.addEventListener('change', () => { if (motion.matches) showStill(); });
    play();
  }

  function initAnimations() {
    if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const elements = new Set(document.querySelectorAll('[data-reveal]'));
    const delays = new WeakMap();
    document.querySelectorAll('[data-stagger]').forEach(group => {
      [...group.children].forEach((element, i) => { elements.add(element); delays.set(element, (i % 4) * 65); });
    });
    const animations = new Map();
    const reveal = (element, animate = true) => {
      observer.unobserve(element);
      element.classList.remove('motion-pending');
      if (!animate || motion.matches) return;
      const photo = element.dataset.reveal === 'photo';
      const frames = photo
        ? [{ opacity: 0, clipPath: 'inset(6% 0 0 0)', transform: 'translateY(24px)' }, { opacity: 1, clipPath: 'inset(0)', transform: 'none' }]
        : [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }];
      const animation = element.animate(frames, { duration: photo ? 1000 : 780, delay: delays.get(element) || 0, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards' });
      animations.set(element, animation);
      animation.onfinish = () => animations.delete(element);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    elements.forEach(element => { element.classList.add('motion-pending'); observer.observe(element); });
    document.addEventListener('focusin', event => {
      elements.forEach(element => {
        if (element.contains(event.target)) {
          reveal(element, false);
          animations.get(element)?.cancel();
          animations.delete(element);
        }
      });
    });
    const restore = () => {
      observer.disconnect();
      elements.forEach(element => element.classList.remove('motion-pending'));
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };
    motion.addEventListener('change', () => { if (motion.matches) restore(); });
    window.addEventListener('pageshow', event => { if (event.persisted) restore(); });
  }

  // Independent features keep the rest of the page usable if an enhancement fails.
  [initLegacyAnchors, initNavigation, initProducts, initClients, initQuoteContext, initProcesses, initHeroVideo, initAnimations].forEach(init => {
    try { init(); } catch (error) { console.error(`No se pudo iniciar ${init.name}`, error); }
  });
});
